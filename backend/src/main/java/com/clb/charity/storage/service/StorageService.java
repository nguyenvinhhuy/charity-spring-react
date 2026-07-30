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
     * @param memberId the uploading member, used to rate-limit uploads
     * @return the public URL of the stored object
     */
    String upload(MultipartFile file, Long memberId);

    /**
     * Deletes a previously uploaded image by its public URL, best-effort.
     *
     * @param secureUrl the URL previously returned by {@link #upload}, or null/blank to no-op
     */
    void deleteByUrl(String secureUrl);
}
