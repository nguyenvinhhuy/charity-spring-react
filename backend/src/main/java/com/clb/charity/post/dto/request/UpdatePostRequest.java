package com.clb.charity.post.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.Nullable;

import java.util.List;

public record UpdatePostRequest(
        @NotBlank @Size(max = 255) String title,
        @Size(max = 500) @Nullable String summary,
        @NotBlank @Size(max = 50000) String content,
        @Size(max = 255) @Nullable String titleEn,
        @Size(max = 500) @Nullable String summaryEn,
        @Size(max = 50000) @Nullable String contentEn,
        @Size(max = 500) @Nullable String thumbnailUrl,
        @Size(max = 10) @Nullable List<@Size(max = 30) String> tags
) {
}
