package com.clb.charity.storage.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.clb.charity.common.config.AppProperties;
import com.clb.charity.common.exception.InvalidFileException;
import com.clb.charity.common.exception.StorageException;
import com.clb.charity.common.exception.TooManyRequestsException;
import com.clb.charity.common.ratelimit.SlidingWindowRateLimiter;
import com.clb.charity.storage.service.StorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Stores uploaded images in Cloudinary and returns the CDN-backed public URL.
 */
@Service
@Slf4j
public class StorageServiceImpl implements StorageService {

    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024; // 5 MB
    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final int UPLOAD_MAX_PER_MEMBER = 20;
    private static final Duration UPLOAD_WINDOW = Duration.ofHours(1);

    private final Cloudinary cloudinary;
    private final AppProperties.Cloudinary config;
    private final SlidingWindowRateLimiter rateLimiter;

    /**
     * Creates the storage service with its Cloudinary client and resolved config.
     *
     * @param cloudinary the Cloudinary client
     * @param appProperties the application properties carrying Cloudinary settings
     * @param rateLimiter the shared sliding-window rate limiter
     */
    public StorageServiceImpl(Cloudinary cloudinary, AppProperties appProperties,
            SlidingWindowRateLimiter rateLimiter) {
        this.cloudinary = cloudinary;
        this.config = appProperties.cloudinary();
        this.rateLimiter = rateLimiter;
    }

    @Override
    public String upload(MultipartFile file, Long memberId) {
        if (!rateLimiter.allow("upload", memberId.toString(), UPLOAD_MAX_PER_MEMBER, UPLOAD_WINDOW)) {
            throw new TooManyRequestsException("Too many uploads, please try again later");
        }
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("File is empty");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new InvalidFileException("File exceeds the 5MB limit");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new InvalidFileException("Unsupported file type. Allowed: " + ALLOWED_TYPES);
        }

        try {
            Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", config.uploadFolder(),
                    "public_id", UUID.randomUUID().toString(),
                    "resource_type", "image",
                    "overwrite", false));
            return (String) result.get("secure_url");
        } catch (Exception ex) {
            throw new StorageException("Failed to upload file: " + ex.getMessage());
        }
    }

    @Override
    public void deleteByUrl(String secureUrl) {
        String publicId = extractPublicId(secureUrl);
        if (publicId == null) {
            return;
        }
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", "image"));
        } catch (Exception ex) {
            log.warn("Failed to delete Cloudinary asset {}: {}", publicId, ex.getMessage());
        }
    }

    // Package-visible (not private) so MediaCleanupJob can reuse this same parsing.
    static String extractPublicId(String secureUrl) {
        if (secureUrl == null || secureUrl.isBlank()) {
            return null;
        }
        int uploadIdx = secureUrl.indexOf("/upload/");
        if (uploadIdx < 0) {
            return null;
        }
        String afterUpload = secureUrl.substring(uploadIdx + "/upload/".length());
        int slashIdx = afterUpload.indexOf('/');
        String withoutVersion = slashIdx >= 0 ? afterUpload.substring(slashIdx + 1) : afterUpload;
        int dotIdx = withoutVersion.lastIndexOf('.');
        return dotIdx >= 0 ? withoutVersion.substring(0, dotIdx) : withoutVersion;
    }
}
