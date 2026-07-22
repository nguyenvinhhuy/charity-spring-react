package com.clb.charity.campaign.dto.response;

import com.clb.charity.campaign.domain.CampaignCategory;
import com.clb.charity.campaign.domain.CampaignStatus;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;

public record CampaignSummaryResponse(
        Long id,
        String title,
        String slug,
        @Nullable String summary,
        @Nullable String titleEn,
        @Nullable String summaryEn,
        @Nullable String thumbnailUrl,
        long targetAmount,
        long currentAmount,
        int donorCount,
        CampaignStatus status,
        CampaignCategory category,
        LocalDate startDate,
        @Nullable LocalDate endDate,
        @Nullable LocalDate eventStartDate,
        @Nullable LocalDate eventEndDate
) {
}
