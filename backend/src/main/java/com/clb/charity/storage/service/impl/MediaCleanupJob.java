package com.clb.charity.storage.service.impl;

import com.clb.charity.common.config.AppProperties;
import com.cloudinary.Cloudinary;
import com.cloudinary.api.ApiResponse;
import com.cloudinary.utils.ObjectUtils;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Deletes Cloudinary images that are no longer referenced by any entity, regardless of how they
 * became orphaned (a cancelled form, a rate-limited abuse attempt, or anything else).
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class MediaCleanupJob {

    // Skips assets uploaded too recently, so one still mid-save isn't deleted before its URL is persisted.
    private static final Duration GRACE_PERIOD = Duration.ofHours(24);
    private static final int PAGE_SIZE = 500;

    private final Cloudinary cloudinary;
    private final AppProperties appProperties;
    private final EntityManager entityManager;

    /**
     * Scans Cloudinary for images outside every entity's referenced set and deletes the stale ones.
     */
    @Scheduled(cron = "0 0 0 * * *", zone = "Asia/Ho_Chi_Minh")
    @Transactional(readOnly = true)
    void cleanupOrphanedImages() {
        AppProperties.Cloudinary config = appProperties.cloudinary();
        if (config.cloudName() == null || config.cloudName().isBlank()) {
            return; // Cloudinary not configured in this environment — nothing to clean.
        }
        Set<String> referencedPublicIds = fetchReferencedPublicIds();
        Instant cutoff = Instant.now().minus(GRACE_PERIOD);
        int deleted = 0;
        int kept = 0;
        String cursor = null;
        try {
            do {
                Map<String, Object> options = new HashMap<>(Map.of(
                        "type", "upload",
                        "prefix", config.uploadFolder(),
                        "max_results", PAGE_SIZE));
                if (cursor != null) {
                    options.put("next_cursor", cursor);
                }
                ApiResponse response = cloudinary.api().resources(options);
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> resources = (List<Map<String, Object>>) response.get("resources");
                for (Map<String, Object> resource : resources) {
                    String publicId = (String) resource.get("public_id");
                    Instant createdAt = Instant.parse((String) resource.get("created_at"));
                    if (referencedPublicIds.contains(publicId) || createdAt.isAfter(cutoff)) {
                        kept++;
                        continue;
                    }
                    cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", "image"));
                    deleted++;
                }
                cursor = (String) response.get("next_cursor");
            } while (cursor != null);
            log.info("Cloudinary cleanup: deleted {} orphaned image(s), kept {}", deleted, kept);
        } catch (Exception ex) {
            log.warn("Cloudinary cleanup failed: {}", ex.getMessage());
        }
    }

    // Native SQL, not each feature's repository, to stay by-id-only and avoid cross-feature imports.
    private Set<String> fetchReferencedPublicIds() {
        @SuppressWarnings("unchecked")
        List<String> urls = entityManager.createNativeQuery("""
                SELECT avatar_url FROM members WHERE avatar_url IS NOT NULL
                UNION ALL
                SELECT thumbnail_url FROM campaigns WHERE thumbnail_url IS NOT NULL
                UNION ALL
                SELECT thumbnail_url FROM posts WHERE thumbnail_url IS NOT NULL
                UNION ALL
                SELECT logo_url FROM partners WHERE logo_url IS NOT NULL
                """)
                .getResultList();
        return urls.stream()
                .map(StorageServiceImpl::extractPublicId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }
}
