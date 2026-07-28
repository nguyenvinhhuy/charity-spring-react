package com.clb.charity.partner.dto.response;

import org.jspecify.annotations.Nullable;

import java.time.Instant;

public record PartnerResponse(
        Long id,
        String name,
        String logoUrl,
        @Nullable String websiteUrl,
        @Nullable Integer displayOrder,
        @Nullable Instant createdAt,
        @Nullable Instant updatedAt
) {
}
