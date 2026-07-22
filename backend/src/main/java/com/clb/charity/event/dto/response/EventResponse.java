package com.clb.charity.event.dto.response;

import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.time.LocalDate;

public record EventResponse(
        Long id,
        String title,
        @Nullable String titleEn,
        @Nullable String description,
        @Nullable String descriptionEn,
        LocalDate eventStartDate,
        @Nullable LocalDate eventEndDate,
        @Nullable String location,
        @Nullable Long createdBy,
        @Nullable Instant createdAt,
        @Nullable Instant updatedAt
) {
}
