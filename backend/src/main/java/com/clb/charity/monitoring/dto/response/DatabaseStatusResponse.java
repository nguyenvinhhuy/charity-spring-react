package com.clb.charity.monitoring.dto.response;

import org.jspecify.annotations.Nullable;

import java.util.List;

/**
 * Current storage usage of the Supabase (Postgres) database.
 *
 * @param databaseSizeBytes total size of the current database, in bytes
 * @param databaseLimitBytes the configured free-tier size limit, in bytes
 * @param activeConnections number of active connections to this database
 * @param topTables the largest tables by total size, for the breakdown donut chart
 * @param errorMessage set when this card could not be fetched; null otherwise
 */
public record DatabaseStatusResponse(
        long databaseSizeBytes,
        long databaseLimitBytes,
        int activeConnections,
        List<CategoryAmount> topTables,
        @Nullable String errorMessage
) {
}
