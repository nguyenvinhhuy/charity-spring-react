package com.clb.charity.campaign.dto.request;

import com.clb.charity.campaign.domain.CampaignCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;
import java.util.List;

/**
 * Editable campaign fields. Status, currentAmount and donorCount are changed
 * through their own dedicated endpoints, not here.
 */
public record UpdateCampaignRequest(
        @NotBlank @Size(max = 255) String title,
        @Size(max = 500) @Nullable String summary,
        @NotBlank @Size(max = 50000) String description,
        @Size(max = 255) @Nullable String titleEn,
        @Size(max = 500) @Nullable String summaryEn,
        @Size(max = 50000) @Nullable String descriptionEn,
        @Size(max = 500) @Nullable String thumbnailUrl,
        @Size(max = 10) @Nullable List<@Size(max = 300) String> images,
        @Positive long targetAmount,
        @NotBlank @Pattern(regexp = "\\d+", message = "Bank account number must contain digits only") String bankAccountNo,
        @NotBlank String bankAccountName,
        @Size(max = 100) @Nullable String qrDescription,
        @Size(max = 500) @Nullable String thienNguyenUrl,
        @Size(max = 500) @Nullable String statementUrl,
        @NotNull CampaignCategory category,
        @NotNull LocalDate startDate,
        @Nullable LocalDate endDate,
        @Nullable LocalDate eventStartDate,
        @Nullable LocalDate eventEndDate,
        @Positive @Nullable Integer capacity
) {
}
