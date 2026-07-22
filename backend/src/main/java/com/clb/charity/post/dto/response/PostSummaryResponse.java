package com.clb.charity.post.dto.response;

import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.List;

public record PostSummaryResponse(
        Long id,
        String title,
        String slug,
        @Nullable String summary,
        @Nullable String titleEn,
        @Nullable String summaryEn,
        @Nullable String thumbnailUrl,
        List<String> tags,
        boolean isPublished,
        @Nullable Instant publishedAt,
        Instant createdAt
) {
}
