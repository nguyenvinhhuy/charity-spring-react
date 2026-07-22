package com.clb.charity.member.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.Nullable;

public record UpdateProfileRequest(
        @NotBlank @Size(max = 100) String fullName,
        @Size(max = 30) @Nullable String phone,
        @Nullable String bio,
        @Size(max = 500) @Nullable String avatarUrl
) {
}
