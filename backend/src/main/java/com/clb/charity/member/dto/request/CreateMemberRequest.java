package com.clb.charity.member.dto.request;

import com.clb.charity.common.validation.ValidPassword;
import com.clb.charity.member.domain.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateMemberRequest(
        @NotBlank String fullName,
        @NotBlank @Email String email,
        @NotBlank @ValidPassword String password,
        @NotNull Role role
) {
}
