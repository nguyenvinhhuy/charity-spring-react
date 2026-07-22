package com.clb.charity.campaign.dto.response;

import com.clb.charity.campaign.domain.CampaignCategory;
import com.clb.charity.campaign.domain.CampaignStatus;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.List;

/**
 * Aggregated campaign and donation statistics for the dashboard.
 */
public record CampaignStatsResponse(
        long totalRaised,
        int totalDonors,
        long activeCount,
        long completedCount,
        long totalCount,
        List<StatusCount> statusCounts,
        List<CategoryAmount> categoryAmounts,
        List<CampaignProgressView> progress,
        List<DonationPoint> donationSeries,
        List<CampaignActivityView> recentCampaigns,
        List<DonationActivityView> recentDonations
) {

    public record StatusCount(CampaignStatus status, long count) {
    }

    public record CategoryAmount(CampaignCategory category, long amount) {
    }

    public record CampaignProgressView(
            Long id,
            String title,
            @Nullable String titleEn,
            long currentAmount,
            long targetAmount,
            int percent,
            CampaignStatus status
    ) {
    }

    public record DonationPoint(String period, long amount, long count) {
    }

    public record CampaignActivityView(
            Long id,
            String title,
            @Nullable Long createdBy,
            @Nullable Instant createdAt
    ) {
    }

    public record DonationActivityView(
            Long campaignId,
            String campaignTitle,
            long amount,
            @Nullable String donorName,
            @Nullable Long createdBy,
            @Nullable Instant createdAt
    ) {
    }
}
