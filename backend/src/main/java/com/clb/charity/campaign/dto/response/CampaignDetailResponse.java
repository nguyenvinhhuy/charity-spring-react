package com.clb.charity.campaign.dto.response;

import com.clb.charity.campaign.domain.CampaignCategory;
import com.clb.charity.campaign.domain.CampaignStatus;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record CampaignDetailResponse(
        Long id,
        String title,
        String slug,
        @Nullable String summary,
        String description,
        @Nullable String titleEn,
        @Nullable String summaryEn,
        @Nullable String descriptionEn,
        @Nullable String thumbnailUrl,
        List<String> images,
        long targetAmount,
        long currentAmount,
        int donorCount,
        long viewCount,
        String bankAccountNo,
        String bankAccountName,
        @Nullable String qrDescription,
        @Nullable String thienNguyenUrl,
        @Nullable String statementUrl,
        CampaignStatus status,
        CampaignCategory category,
        LocalDate startDate,
        @Nullable LocalDate endDate,
        @Nullable LocalDate eventStartDate,
        @Nullable LocalDate eventEndDate,
        @Nullable Integer capacity,
        @Nullable Long createdBy,
        @Nullable Instant createdAt,
        @Nullable Instant updatedAt
) {
}
