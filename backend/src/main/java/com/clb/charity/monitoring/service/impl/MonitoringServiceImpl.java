package com.clb.charity.monitoring.service.impl;

import com.clb.charity.common.config.AppProperties;
import com.clb.charity.monitoring.domain.MetricRange;
import com.clb.charity.monitoring.domain.MonitoringResource;
import com.clb.charity.monitoring.domain.RenderState;
import com.clb.charity.monitoring.domain.VercelState;
import com.clb.charity.monitoring.dto.response.CategoryAmount;
import com.clb.charity.monitoring.dto.response.CloudinaryStatusResponse;
import com.clb.charity.monitoring.dto.response.DatabaseStatusResponse;
import com.clb.charity.monitoring.dto.response.DeployDurationPoint;
import com.clb.charity.monitoring.dto.response.MetricPoint;
import com.clb.charity.monitoring.dto.response.MonitoringOverviewResponse;
import com.clb.charity.monitoring.dto.response.RenderStatusResponse;
import com.clb.charity.monitoring.dto.response.VercelStatusResponse;
import com.clb.charity.monitoring.service.AlertService;
import com.clb.charity.monitoring.service.MonitoringService;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Fetches external service status and periodically checks it against an alert threshold.
 */
@Service
@Slf4j
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class MonitoringServiceImpl implements MonitoringService {

    private static final int TOP_TABLES_LIMIT = 7;
    private static final int MAX_BUILDS_RETURNED = 60; // safety cap regardless of range, so an active project's 1-month view stays light
    /** The alert-check job always evaluates the shortest range, independent of whatever the UI is showing. */
    private static final MetricRange ALERT_CHECK_RANGE = MetricRange.ONE_DAY;
    /** Render Free plan instance RAM cap — bump this if the plan ever changes. */
    private static final long RENDER_MEMORY_LIMIT_BYTES = 512L * 1024 * 1024;
    /** Matches the alert job's own polling cadence, so each check covers the window since the previous one. */
    private static final long ALERT_METRIC_LOOKBACK_SECONDS = 15 * 60;
    /** Render's documented minimum bucket size — coarser buckets would dilute brief spikes into an average. */
    private static final long ALERT_METRIC_RESOLUTION_SECONDS = 30;

    private final RestClient restClient;
    private final Cloudinary cloudinary;
    private final EntityManager entityManager;
    private final AppProperties appProperties;
    private final AlertService alertService;
    private final ObjectMapper objectMapper;

    // In-memory only: the backend runs as a single instance (same reasoning as InquiryRateLimiter), and this
    // only needs to debounce repeat alert emails, not survive a restart.
    private final Map<MonitoringResource, Boolean> alertingByResource = new ConcurrentHashMap<>();

    @Override
    public MonitoringOverviewResponse getOverview(MetricRange range) {
        return new MonitoringOverviewResponse(
                fetchRenderStatus(range),
                fetchVercelStatus(range),
                fetchDatabaseStatus(),
                fetchCloudinaryStatus(),
                Instant.now());
    }

    // ── Render ────────────────────────────────────────────────────────────

    /**
     * Fetches Render's service/deploy status plus a CPU/memory metrics window sized to the given range.
     *
     * @param range the selected time window (controls both lookback and point resolution)
     */
    private RenderStatusResponse fetchRenderStatus(MetricRange range) {
        return fetchRenderStatus(range.lookbackSeconds(), range.resolutionSeconds());
    }

    /**
     * Fetches Render's service/deploy status plus a CPU/memory metrics window.
     *
     * @param metricLookbackSeconds how far back the CPU/memory series should reach
     * @param metricResolutionSeconds the bucket size for the CPU/memory series
     */
    private RenderStatusResponse fetchRenderStatus(long metricLookbackSeconds, long metricResolutionSeconds) {
        AppProperties.Render config = appProperties.render();
        if (isBlank(config.apiKey()) || isBlank(config.serviceId())) {
            return new RenderStatusResponse(false, RenderState.NOT_CONFIGURED, null, null, null, List.of(), List.of(), null);
        }
        try {
            JsonNode service = getJson("https://api.render.com/v1/services/{id}", config.apiKey(), config.serviceId());
            // Render's documented "suspended" field is the string enum "suspended" / "not_suspended".
            boolean suspended = "suspended".equalsIgnoreCase(service.path("suspended").asString(""));
            String serviceUrl = service.path("serviceDetails").path("url").asString(null);

            JsonNode deploys = getJson("https://api.render.com/v1/services/{id}/deploys?limit=1", config.apiKey(), config.serviceId());
            JsonNode firstDeploy = deploys.isArray() && !deploys.isEmpty() ? deploys.get(0).path("deploy") : null;
            String lastDeployStatus = firstDeploy != null ? firstDeploy.path("status").asString(null) : null;
            Instant lastDeployAt = firstDeploy != null ? parseInstant(firstDeploy.path("finishedAt").asString(null)) : null;
            boolean deployFailed = lastDeployStatus != null && lastDeployStatus.toLowerCase().contains("fail");

            List<MetricPoint> cpuSeries = fetchMetricSeries(
                    "cpu", config.apiKey(), config.serviceId(), metricLookbackSeconds, metricResolutionSeconds);
            List<MetricPoint> memorySeries = fetchMetricSeries(
                    "memory", config.apiKey(), config.serviceId(), metricLookbackSeconds, metricResolutionSeconds);

            RenderState state = deployFailed ? RenderState.ERROR : (suspended ? RenderState.SUSPENDED : RenderState.LIVE);
            return new RenderStatusResponse(true, state, lastDeployStatus, lastDeployAt, serviceUrl, cpuSeries, memorySeries, null);
        } catch (Exception ex) {
            log.warn("Failed to fetch Render status: {}", ex.getMessage());
            return new RenderStatusResponse(true, RenderState.ERROR, null, null, null, List.of(), List.of(), ex.getMessage());
        }
    }

    /**
     * Fetches a Render metrics time series (CPU or memory, both normalized to a 0-100 percent).
     *
     * @param metric "cpu" or "memory"
     * @param apiKey Render API key
     * @param serviceId Render service id
     * @param lookbackSeconds how far back the series should reach
     * @param resolutionSeconds the bucket size for each returned point
     */
    private List<MetricPoint> fetchMetricSeries(
            String metric, String apiKey, String serviceId, long lookbackSeconds, long resolutionSeconds) {
        Instant end = Instant.now();
        Instant start = end.minusSeconds(lookbackSeconds);
        String url = "https://api.render.com/v1/metrics/" + metric
                + "?resource={resource}&startTime={start}&endTime={end}&resolutionSeconds={resolution}";
        try {
            // Render's metrics API rejects epoch-second integers for startTime/endTime ("invalid filter
            // parameter") — it requires RFC3339 timestamps, which Instant#toString produces directly.
            JsonNode root = getJson(url, apiKey, serviceId, start.toString(), end.toString(), resolutionSeconds);
            List<MetricPoint> points = new ArrayList<>();
            // Response shape isn't fully verified without a live API key — defensively handle either a flat
            // array of {timestamp, value} points, or an array of series each carrying a nested "values" array.
            JsonNode samples = root.isArray() && !root.isEmpty() && root.get(0).has("values")
                    ? root.get(0).path("values")
                    : root;
            if (samples.isArray()) {
                for (JsonNode point : samples) {
                    Instant ts = parseInstant(point.path("timestamp").asString(null));
                    double value = point.path("value").asDouble(0);
                    // Render reports memory as raw bytes used, unlike CPU which is already a 0-100 percent.
                    if ("memory".equals(metric)) {
                        value = value / RENDER_MEMORY_LIMIT_BYTES * 100;
                    }
                    if (ts != null) {
                        points.add(new MetricPoint(ts, value));
                    }
                }
            }
            return points;
        } catch (Exception ex) {
            log.warn("Failed to fetch Render {} metrics: {}", metric, ex.getMessage());
            return List.of();
        }
    }

    // ── Vercel ────────────────────────────────────────────────────────────

    private VercelStatusResponse fetchVercelStatus(MetricRange range) {
        AppProperties.Vercel config = appProperties.vercel();
        if (isBlank(config.apiToken()) || isBlank(config.projectId())) {
            return new VercelStatusResponse(false, VercelState.NOT_CONFIGURED, null, List.of(), null);
        }
        try {
            // ALL means "as many as Vercel will return" — no since filter, just the limit cap.
            String url = range == MetricRange.ALL
                    ? "https://api.vercel.com/v6/deployments?projectId={id}&limit={limit}"
                    : "https://api.vercel.com/v6/deployments?projectId={id}&limit={limit}&since={since}";
            JsonNode root = range == MetricRange.ALL
                    ? getJson(url, config.apiToken(), config.projectId(), MAX_BUILDS_RETURNED)
                    : getJson(url, config.apiToken(), config.projectId(), MAX_BUILDS_RETURNED,
                            (Instant.now().getEpochSecond() - range.lookbackSeconds()) * 1000);
            JsonNode deployments = root.path("deployments");
            List<DeployDurationPoint> recentBuilds = new ArrayList<>();
            VercelState latestState = VercelState.NOT_CONFIGURED;
            String latestUrl = null;
            if (deployments.isArray()) {
                for (JsonNode d : deployments) {
                    VercelState state = parseVercelState(d.path("state").asString("UNKNOWN"));
                    long createdMs = d.path("created").asLong(0);
                    long readyMs = d.path("ready").asLong(0);
                    long buildSeconds = readyMs > createdMs ? (readyMs - createdMs) / 1000 : 0;
                    recentBuilds.add(new DeployDurationPoint(Instant.ofEpochMilli(createdMs), buildSeconds, state));
                }
                if (!recentBuilds.isEmpty()) {
                    // Vercel returns deployments newest-first; reverse so the chart reads left-to-right in time.
                    latestState = recentBuilds.getFirst().state();
                    latestUrl = deployments.get(0).path("url").asString(null);
                }
            }
            Collections.reverse(recentBuilds);
            return new VercelStatusResponse(true, latestState, latestUrl, recentBuilds, null);
        } catch (Exception ex) {
            log.warn("Failed to fetch Vercel status: {}", ex.getMessage());
            return new VercelStatusResponse(true, VercelState.ERROR, null, List.of(), ex.getMessage());
        }
    }

    private VercelState parseVercelState(String raw) {
        return switch (raw.toUpperCase()) {
            case "READY" -> VercelState.READY;
            case "BUILDING", "QUEUED", "INITIALIZING" -> VercelState.BUILDING;
            case "ERROR", "CANCELED" -> VercelState.ERROR;
            default -> VercelState.ERROR;
        };
    }

    // ── Database (Supabase/Postgres, queried directly) ──────────────────

    // Queried directly rather than through a separate Supabase Management API token, since the backend
    // already holds a live JDBC connection to this same database.
    private DatabaseStatusResponse fetchDatabaseStatus() {
        try {
            long sizeBytes = ((Number) entityManager
                    .createNativeQuery("SELECT pg_database_size(current_database())")
                    .getSingleResult()).longValue();
            int connections = ((Number) entityManager
                    .createNativeQuery("SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()")
                    .getSingleResult()).intValue();

            @SuppressWarnings("unchecked")
            List<Object[]> rows = entityManager.createNativeQuery("""
                    SELECT c.relname AS table_name, pg_total_relation_size(c.oid) AS size_bytes
                    FROM pg_class c
                    JOIN pg_namespace n ON n.oid = c.relnamespace
                    WHERE n.nspname = 'public' AND c.relkind = 'r'
                    ORDER BY size_bytes DESC
                    LIMIT :limit
                    """)
                    .setParameter("limit", TOP_TABLES_LIMIT)
                    .getResultList();
            List<CategoryAmount> topTables = rows.stream()
                    .map(row -> new CategoryAmount((String) row[0], ((Number) row[1]).longValue()))
                    .toList();

            return new DatabaseStatusResponse(sizeBytes, appProperties.alert().databaseLimitBytes(), connections, topTables, null);
        } catch (Exception ex) {
            log.warn("Failed to fetch database status: {}", ex.getMessage());
            return new DatabaseStatusResponse(0, appProperties.alert().databaseLimitBytes(), 0, List.of(), ex.getMessage());
        }
    }

    // ── Cloudinary ────────────────────────────────────────────────────────

    private CloudinaryStatusResponse fetchCloudinaryStatus() {
        AppProperties.Cloudinary config = appProperties.cloudinary();
        if (isBlank(config.cloudName()) || isBlank(config.apiKey())) {
            return new CloudinaryStatusResponse(false, 0, appProperties.alert().cloudinaryLimitBytes(), 0, List.of(), null);
        }
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> usage = cloudinary.api().usage(ObjectUtils.emptyMap());
            long storageUsed = extractUsageBytes(usage, "storage");
            long bandwidthUsed = extractUsageBytes(usage, "bandwidth");

            // Cloudinary's account-level usage() call does not reliably break storage down by resource type
            // (image/video/raw) — only a single total is well-documented. Show that single slice rather than
            // guessing at undocumented fields; revisit once real Cloudinary usage is high enough to matter.
            List<CategoryAmount> byResourceType = storageUsed > 0
                    ? List.of(new CategoryAmount("Tổng dung lượng", storageUsed))
                    : List.of();

            return new CloudinaryStatusResponse(true, storageUsed, appProperties.alert().cloudinaryLimitBytes(), bandwidthUsed, byResourceType, null);
        } catch (Exception ex) {
            log.warn("Failed to fetch Cloudinary status: {}", ex.getMessage());
            return new CloudinaryStatusResponse(true, 0, appProperties.alert().cloudinaryLimitBytes(), 0, List.of(), ex.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private long extractUsageBytes(Map<String, Object> usage, String key) {
        Object section = usage.get(key);
        if (section instanceof Map<?, ?> map && map.get("usage") instanceof Number n) {
            return n.longValue();
        }
        return 0;
    }

    // ── Alert scheduler (threshold + error → email, debounced) ──────────

    /**
     * Emails on threshold transitions only, never repeating while a service stays in the same state.
     */
    @Scheduled(fixedRate = 900_000)
    void checkThresholdsAndAlert() {
        double threshold = appProperties.alert().thresholdFraction();

        // Render's CPU/memory are fetched at a much finer resolution than the UI chart uses, so a brief spike
        // that both starts and ends between two scheduler runs still shows up as its own data point instead of
        // being averaged away inside a coarse bucket.
        RenderStatusResponse render = fetchRenderStatus(ALERT_METRIC_LOOKBACK_SECONDS, ALERT_METRIC_RESOLUTION_SECONDS);
        evaluate(MonitoringResource.RENDER,
                render.configured() && render.status() != RenderState.NOT_CONFIGURED
                        && (render.status() == RenderState.ERROR
                                || anyOverThreshold(render.cpuSeries(), threshold)
                                || anyOverThreshold(render.memorySeries(), threshold)),
                "Render (backend) đang gặp vấn đề hoặc CPU/RAM vượt " + (int) (threshold * 100) + "% — có thể do lượng truy cập tăng đột biến.");

        VercelStatusResponse vercel = fetchVercelStatus(ALERT_CHECK_RANGE);
        evaluate(MonitoringResource.VERCEL,
                vercel.configured() && vercel.status() == VercelState.ERROR,
                "Lần deploy Vercel (frontend) gần nhất bị lỗi.");

        DatabaseStatusResponse database = fetchDatabaseStatus();
        evaluate(MonitoringResource.DATABASE,
                database.errorMessage() == null
                        && fraction(database.databaseSizeBytes(), database.databaseLimitBytes()) > threshold,
                "Dung lượng Database (Supabase) đã vượt " + (int) (threshold * 100) + "% giới hạn free tier.");

        CloudinaryStatusResponse cloudinary = fetchCloudinaryStatus();
        evaluate(MonitoringResource.CLOUDINARY,
                cloudinary.configured()
                        && fraction(cloudinary.storageUsedBytes(), cloudinary.storageLimitBytes()) > threshold,
                "Dung lượng Cloudinary đã vượt " + (int) (threshold * 100) + "% giới hạn free tier.");
    }

    // Package-private (not private) so the debounce transitions can be unit-tested directly.
    void evaluate(MonitoringResource resource, boolean isAlerting, String alertMessage) {
        Boolean wasAlerting = alertingByResource.get(resource);
        if (isAlerting && !Boolean.TRUE.equals(wasAlerting)) {
            alertService.sendAlertEmail("[CLB Charity] Cảnh báo: " + resource, "<p>" + alertMessage + "</p>");
        } else if (!isAlerting && Boolean.TRUE.equals(wasAlerting)) {
            alertService.sendAlertEmail("[CLB Charity] Đã phục hồi: " + resource,
                    "<p>" + resource + " đã trở lại bình thường.</p>");
        }
        alertingByResource.put(resource, isAlerting);
    }

    private double fraction(long used, long limit) {
        return limit <= 0 ? 0 : (double) used / limit;
    }

    /**
     * Checks whether any sample in the series crossed the threshold, not just the latest one.
     *
     * @param series the metric samples to check
     * @param threshold the alert threshold as a 0-1 fraction (e.g. 0.8 for 80%)
     */
    private boolean anyOverThreshold(List<MetricPoint> series, double threshold) {
        return series.stream().anyMatch(point -> point.value() > threshold * 100);
    }

    // ── HTTP helpers ──────────────────────────────────────────────────────

    private JsonNode getJson(String url, String bearerToken, Object... uriVars) {
        String body = restClient.get()
                .uri(url, uriVars)
                .headers(h -> h.setBearerAuth(bearerToken))
                .retrieve()
                .body(String.class);
        return objectMapper.readTree(body != null ? body : "{}");
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static Instant parseInstant(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(raw);
        } catch (Exception ex) {
            return null;
        }
    }
}
