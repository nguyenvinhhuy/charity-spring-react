package com.clb.charity.campaign.dto.request;

import jakarta.validation.constraints.PositiveOrZero;

public record UpdateProgressRequest(
        @PositiveOrZero long currentAmount,
        @PositiveOrZero int donorCount
) {
}
