package com.clb.charity.faq.dto.response;

import org.jspecify.annotations.Nullable;

import java.time.Instant;

public record FaqResponse(
        Long id,
        String question,
        String answer,
        @Nullable String questionEn,
        @Nullable String answerEn,
        @Nullable String category,
        int sortOrder,
        boolean isPublished,
        @Nullable Instant publishedAt,
        @Nullable Long createdBy,
        @Nullable Instant createdAt,
        @Nullable Instant updatedAt
) {
}
