package com.clb.charity.inquiry.dto.response;

import com.clb.charity.inquiry.domain.InquiryStatus;
import org.jspecify.annotations.Nullable;

import java.time.Instant;

public record InquiryResponse(
        Long id,
        String fullName,
        String email,
        String subject,
        String message,
        InquiryStatus status,
        Instant createdAt,
        @Nullable Instant handledAt
) {
}
