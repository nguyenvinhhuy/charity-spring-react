package com.clb.charity.storage;

import com.clb.charity.common.config.AppProperties;
import com.clb.charity.common.exception.InvalidFileException;
import com.clb.charity.common.exception.TooManyRequestsException;
import com.clb.charity.common.ratelimit.SlidingWindowRateLimiter;
import com.clb.charity.storage.service.impl.StorageServiceImpl;
import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StorageServiceImplTest {

    private static final Long MEMBER_ID = 1L;

    @Mock
    private Cloudinary cloudinary;

    @Mock
    private Uploader uploader;

    @Mock
    private AppProperties appProperties;

    // Real instance, not a mock, so rate-limit behavior is actually exercised.
    private final SlidingWindowRateLimiter rateLimiter = new SlidingWindowRateLimiter();

    private StorageServiceImpl storageService;

    @BeforeEach
    void setUp() {
        lenient().when(appProperties.cloudinary())
                .thenReturn(new AppProperties.Cloudinary("cloud", "key", "secret", "clb-media"));
        storageService = new StorageServiceImpl(cloudinary, appProperties, rateLimiter);
    }

    @Test
    void upload_exceedingPerMemberLimit_throwsTooManyRequests() {
        for (int i = 0; i < 20; i++) {
            // Rate limit is checked before file validation, so a null file is fine here.
            assertThrows(InvalidFileException.class, () -> storageService.upload(null, MEMBER_ID));
        }
        assertThrows(TooManyRequestsException.class, () -> storageService.upload(null, MEMBER_ID));
    }

    @Test
    void deleteByUrl_destroysTheFolderPrefixedPublicId() throws Exception {
        when(cloudinary.uploader()).thenReturn(uploader);
        String url = "https://res.cloudinary.com/cloud/image/upload/v1234567890/clb-media/abc-123.jpg";

        storageService.deleteByUrl(url);

        verify(uploader).destroy(eq("clb-media/abc-123"), anyMap());
    }

    @Test
    void deleteByUrl_doesNothing_whenUrlIsBlank() {
        storageService.deleteByUrl("");
        storageService.deleteByUrl(null);
        // No Cloudinary interaction should happen for a blank/null URL.
    }

    @Test
    void deleteByUrl_swallowsCloudinaryFailures() throws Exception {
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.destroy(any(), anyMap())).thenThrow(new RuntimeException("boom"));
        String url = "https://res.cloudinary.com/cloud/image/upload/v1/clb-media/x.png";

        storageService.deleteByUrl(url);
    }
}
