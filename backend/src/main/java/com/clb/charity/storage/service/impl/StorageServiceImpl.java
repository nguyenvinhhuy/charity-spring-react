package com.clb.charity.storage.service.impl;

import com.clb.charity.common.config.AppProperties;
import com.clb.charity.common.exception.InvalidFileException;
import com.clb.charity.common.exception.StorageException;
import com.clb.charity.storage.service.StorageService;
import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Stores uploaded images in a MinIO (S3-compatible) bucket and returns a browser-reachable public URL.
 */
@Service
@Slf4j
public class StorageServiceImpl implements StorageService {

    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024; // 5 MB
    private static final String OBJECT_PREFIX = "images/";
    private static final Map<String, String> EXTENSION_BY_TYPE = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp");
    private static final Set<String> ALLOWED_TYPES = EXTENSION_BY_TYPE.keySet();

    private final MinioClient minioClient;
    private final AppProperties.Minio config;

    /**
     * Creates the storage service with its MinIO client and resolved config.
     *
     * @param minioClient the MinIO client
     * @param appProperties the application properties carrying MinIO settings
     */
    public StorageServiceImpl(MinioClient minioClient, AppProperties appProperties) {
        this.minioClient = minioClient;
        this.config = appProperties.minio();
    }

    /**
     * Ensures the configured bucket exists, creating it when missing.
     */
    @PostConstruct
    void ensureBucket() {
        try {
            boolean exists = minioClient.bucketExists(
                    BucketExistsArgs.builder().bucket(config.bucket()).build());
            if (!exists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(config.bucket()).build());
                log.info("Created MinIO bucket '{}'", config.bucket());
            }
        } catch (Exception ex) {
            // Do not crash startup if MinIO is briefly unavailable; log and continue.
            log.warn("Could not verify/create MinIO bucket '{}': {}", config.bucket(), ex.getMessage());
        }
    }

    @Override
    public String upload(MultipartFile file) {
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

        String objectKey = OBJECT_PREFIX + UUID.randomUUID() + EXTENSION_BY_TYPE.get(contentType);
        try (InputStream in = file.getInputStream()) {
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(config.bucket())
                    .object(objectKey)
                    .stream(in, file.getSize(), -1)
                    .contentType(contentType)
                    .build());
        } catch (Exception ex) {
            throw new StorageException("Failed to upload file: " + ex.getMessage());
        }
        return config.publicEndpoint() + "/" + config.bucket() + "/" + objectKey;
    }
}
