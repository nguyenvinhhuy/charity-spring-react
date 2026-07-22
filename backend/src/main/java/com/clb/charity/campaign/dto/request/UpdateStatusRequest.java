package com.clb.charity.campaign.dto.request;

import com.clb.charity.campaign.domain.CampaignStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(@NotNull CampaignStatus status) {
}
