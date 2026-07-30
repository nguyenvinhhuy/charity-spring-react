package com.clb.charity.settings.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateClubSettingsRequest(
        @NotBlank @Size(max = 50) @Pattern(regexp = "\\d+", message = "Bank account number must contain digits only") String bankAccountNo,
        @NotBlank @Size(max = 100) String bankAccountName
) {
}
