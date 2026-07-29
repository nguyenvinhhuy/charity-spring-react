package com.clb.charity.monitoring.dto.response;

import com.clb.charity.monitoring.domain.RenderState;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.List;

/**
 * Current status and recent CPU/memory trend of the Render-hosted backend service.
 *
 * @param configured whether {@code RENDER_API_KEY}/{@code RENDER_SERVICE_ID} are set
 * @param status the service's high-level state
 * @param lastDeployStatus the most recent deploy's status, as reported by Render
 * @param lastDeployAt when the most recent deploy finished
 * @param serviceUrl the service's public URL
 * @param cpuSeries recent CPU usage samples (percent of allocated CPU)
 * @param memorySeries recent memory usage samples (percent of the instance's max memory)
 * @param errorMessage set when this card could not be fetched; null otherwise
 */
public record RenderStatusResponse(
        boolean configured,
        RenderState status,
        @Nullable String lastDeployStatus,
        @Nullable Instant lastDeployAt,
        @Nullable String serviceUrl,
        List<MetricPoint> cpuSeries,
        List<MetricPoint> memorySeries,
        @Nullable String errorMessage
) {
}
