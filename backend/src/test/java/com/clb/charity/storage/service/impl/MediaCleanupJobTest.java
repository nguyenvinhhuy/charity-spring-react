package com.clb.charity.storage.service.impl;

import com.clb.charity.common.config.AppProperties;
import com.cloudinary.Api;
import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.cloudinary.api.ApiResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MediaCleanupJobTest {

    private static final String REFERENCED_URL = "https://res.cloudinary.com/demo/image/upload/v1/clb-media/keep-me.jpg";

    @Mock
    private Cloudinary cloudinary;

    @Mock
    private Api api;

    @Mock
    private Uploader uploader;

    @Mock
    private AppProperties appProperties;

    @Mock
    private EntityManager entityManager;

    private MediaCleanupJob job;

    @BeforeEach
    void setUp() {
        when(appProperties.cloudinary()).thenReturn(new AppProperties.Cloudinary("demo", "key", "secret", "clb-media"));
        job = new MediaCleanupJob(cloudinary, appProperties, entityManager);
    }

    @Test
    void cleanup_deletesOnlyUnreferencedImagesPastTheGracePeriod() throws Exception {
        Query query = mock(Query.class);
        when(entityManager.createNativeQuery(anyString())).thenReturn(query);
        when(query.getResultList()).thenReturn(List.of(REFERENCED_URL));

        Map<String, Object> keep = resource("clb-media/keep-me", Instant.now().minus(Duration.ofDays(10)));
        Map<String, Object> orphanOld = resource("clb-media/orphan-old", Instant.now().minus(Duration.ofDays(2)));
        Map<String, Object> orphanRecent = resource("clb-media/orphan-recent", Instant.now().minus(Duration.ofHours(1)));

        ApiResponse response = mock(ApiResponse.class);
        when(response.get("resources")).thenReturn(List.of(keep, orphanOld, orphanRecent));
        when(response.get("next_cursor")).thenReturn(null);
        when(cloudinary.api()).thenReturn(api);
        when(api.resources(anyMap())).thenReturn(response);
        when(cloudinary.uploader()).thenReturn(uploader);

        job.cleanupOrphanedImages();

        verify(uploader).destroy(eq("clb-media/orphan-old"), anyMap());
        verify(uploader, never()).destroy(eq("clb-media/keep-me"), anyMap());
        verify(uploader, never()).destroy(eq("clb-media/orphan-recent"), anyMap());
    }

    @Test
    void cleanup_doesNothing_whenCloudinaryIsNotConfigured() {
        when(appProperties.cloudinary()).thenReturn(new AppProperties.Cloudinary("", "", "", "clb-media"));

        job.cleanupOrphanedImages();

        verify(cloudinary, never()).api();
    }

    private static Map<String, Object> resource(String publicId, Instant createdAt) {
        return Map.of("public_id", publicId, "created_at", createdAt.toString());
    }
}
