package com.clb.charity.storage.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.clb.charity.common.config.AppProperties;
import com.clb.charity.common.exception.InvalidFileException;
import com.clb.charity.common.exception.StorageException;
import com.clb.charity.storage.service.StorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

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

    private final Cloudinary cloudinary;
    private final AppProperties.Cloudinary config;

    /**
     * Creates the storage service with its Cloudinary client and resolved config.
     *
     * @param cloudinary the Cloudinary client
     * @param appProperties the application properties carrying Cloudinary settings
     */
    public StorageServiceImpl(Cloudinary cloudinary, AppProperties appProperties) {
        this.cloudinary = cloudinary;
        this.config = appProperties.cloudinary();
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

        try {
            Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", config.uploadFolder(),
                    "public_id", UUID.randomUUID().toString(),
                    "resource_type", "image",
                    "overwrite", false
            ));
            return (String) result.get("secure_url");
        } catch (Exception ex) {
            throw new StorageException("Failed to upload file: " + ex.getMessage());
        }
    }
}
