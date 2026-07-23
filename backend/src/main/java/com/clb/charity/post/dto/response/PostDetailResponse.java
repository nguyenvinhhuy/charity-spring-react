package com.clb.charity.post.dto.response;

import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.List;

public record PostDetailResponse(
        Long id,
        String title,
        String slug,
        @Nullable String summary,
        String content,
        @Nullable String titleEn,
        @Nullable String summaryEn,
        @Nullable String contentEn,
        @Nullable String thumbnailUrl,
        List<String> tags,
        boolean isPublished,
        @Nullable Instant publishedAt,
        long viewCount,
        @Nullable Long createdBy,
        Instant createdAt,
        Instant updatedAt
) {
}
