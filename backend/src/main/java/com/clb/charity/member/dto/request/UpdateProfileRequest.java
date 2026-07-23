package com.clb.charity.member.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;

public record UpdateProfileRequest(
        @NotBlank @Size(max = 100) String fullName,
        @Size(max = 30) @Nullable String phone,
        @Nullable String bio,
        @Size(max = 500) @Nullable String avatarUrl,
        @Nullable LocalDate dateOfBirth,
        @Size(max = 255) @Nullable String address,
        // Vietnamese CCCD is exactly 12 digits; @Pattern is skipped when the value is null.
        @Pattern(regexp = "\\d{12}") @Nullable String nationalId
) {
}
