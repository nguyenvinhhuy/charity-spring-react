package com.clb.charity.campaign.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;

public record CreateDonationRequest(
        @Positive long amount,
        @Size(max = 150) @Nullable String donorName,
        @NotNull LocalDate donatedAt,
        @Size(max = 500) @Nullable String note
) {
}
