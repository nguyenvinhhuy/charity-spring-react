package com.clb.charity.settings.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateClubSettingsRequest(
        @NotBlank @Size(max = 50) String bankAccountNo,
        @NotBlank @Size(max = 100) String bankAccountName
) {
}
