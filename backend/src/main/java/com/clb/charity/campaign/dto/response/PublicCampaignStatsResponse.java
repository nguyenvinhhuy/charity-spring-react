package com.clb.charity.campaign.dto.response;

/**
 * Aggregated campaign and donation totals safe to expose publicly (no per-donor or per-actor detail).
 */
public record PublicCampaignStatsResponse(
        long totalRaised,
        int totalDonors,
        long activeCount,
        long completedCount,
        long totalCount
) {
}
