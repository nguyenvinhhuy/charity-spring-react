package com.clb.charity.event.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;

public record CreateEventRequest(
        @NotBlank String title,
        @Size(max = 255) @Nullable String titleEn,
        @Nullable String description,
        @Nullable String descriptionEn,
        @NotNull LocalDate eventStartDate,
        @Nullable LocalDate eventEndDate,
        @Size(max = 255) @Nullable String location
) {
}
