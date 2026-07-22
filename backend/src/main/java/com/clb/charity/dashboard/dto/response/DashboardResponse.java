package com.clb.charity.dashboard.dto.response;

import com.clb.charity.campaign.dto.response.CampaignStatsResponse;
import com.clb.charity.member.dto.response.MemberStatsResponse;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.List;

/**
 * Aggregated figures powering the internal dashboard.
 */
public record DashboardResponse(
        long totalRaised,
        int totalDonors,
        long activeCampaigns,
        long completedCampaigns,
        long totalCampaigns,
        long totalMembers,
        List<MemberStatsResponse.RoleCount> membersByRole,
        List<CampaignStatsResponse.CategoryAmount> amountByCategory,
        List<CampaignStatsResponse.CampaignProgressView> campaignProgress,
        List<CampaignStatsResponse.DonationPoint> donationSeries,
        List<ActivityItem> recentActivity
) {

    /** A single entry in the recent-activity feed. */
    public record ActivityItem(
            String type,
            String title,
            long amount,
            @Nullable String actorName,
            @Nullable Instant at
    ) {
    }
}
