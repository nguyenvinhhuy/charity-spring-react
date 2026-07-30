package com.clb.charity.inquiry.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.Nullable;

public record CreateInquiryRequest(
        @NotBlank @Size(max = 150) String fullName,
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Size(max = 200) String subject,
        @NotBlank @Size(max = 1000) String message,
        // Honeypot: hidden from real users on the frontend; a non-blank value means a bot filled every input.
        @Nullable String website,
        // Time-trap: epoch millis when the form was rendered on the frontend, used to reject too-fast submissions.
        @Nullable Long formRenderedAtMs
) {
}
