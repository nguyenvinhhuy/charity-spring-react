package com.clb.charity.monitoring.dto.response;

/**
 * A single slice of a storage-breakdown donut chart (e.g. one database table, or one Cloudinary resource type).
 *
 * @param label the display name of this slice
 * @param bytes the storage size of this slice, in bytes
 */
public record CategoryAmount(String label, long bytes) {
}
