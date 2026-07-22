package com.clb.charity.storage.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * Stores uploaded images and returns browser-reachable public URLs.
 */
public interface StorageService {

    /**
     * Validates and stores an uploaded image, returning its public URL.
     *
     * @param file the multipart image file
     * @return the public URL of the stored object
     */
    String upload(MultipartFile file);
}
