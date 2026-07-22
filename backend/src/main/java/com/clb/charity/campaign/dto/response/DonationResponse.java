package com.clb.charity.campaign.dto.response;

import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.time.LocalDate;

public record DonationResponse(
        Long id,
        Long campaignId,
        long amount,
        @Nullable String donorName,
        LocalDate donatedAt,
        @Nullable String note,
        @Nullable Instant createdAt
) {
}
