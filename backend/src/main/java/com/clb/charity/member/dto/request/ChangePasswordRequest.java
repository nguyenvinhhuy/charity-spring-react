package com.clb.charity.member.dto.request;

import com.clb.charity.common.validation.ValidPassword;
import jakarta.validation.constraints.NotBlank;

public record ChangePasswordRequest(
        @NotBlank String currentPassword,
        @NotBlank @ValidPassword String newPassword
) {
}
