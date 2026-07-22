package com.clb.charity.post.dto.response;

import org.jspecify.annotations.Nullable;

import java.time.Instant;

/**
 * Lightweight recent-post entry for the dashboard activity feed.
 */
public record PostActivityView(
        Long id,
        String title,
        @Nullable Long createdBy,
        @Nullable Instant createdAt
) {
}
