package com.clb.charity.monitoring.dto.response;

import org.jspecify.annotations.Nullable;

import java.util.List;

/**
 * Current storage/bandwidth usage of the Cloudinary account.
 *
 * @param configured whether the Cloudinary credentials are set
 * @param storageUsedBytes total storage used, in bytes
 * @param storageLimitBytes the configured free-tier storage limit, in bytes
 * @param bandwidthUsedBytes bandwidth used in the current billing cycle, in bytes
 * @param byResourceType storage breakdown by resource type (image/video/raw), for the donut chart
 * @param errorMessage set when this card could not be fetched; null otherwise
 */
public record CloudinaryStatusResponse(
        boolean configured,
        long storageUsedBytes,
        long storageLimitBytes,
        long bandwidthUsedBytes,
        List<CategoryAmount> byResourceType,
        @Nullable String errorMessage
) {
}
