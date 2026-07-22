package com.clb.charity.post.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.Nullable;

import java.util.List;

public record UpdatePostRequest(
        @NotBlank String title,
        @Size(max = 500) @Nullable String summary,
        @NotBlank String content,
        @Size(max = 255) @Nullable String titleEn,
        @Size(max = 500) @Nullable String summaryEn,
        @Nullable String contentEn,
        @Size(max = 500) @Nullable String thumbnailUrl,
        @Nullable List<String> tags
) {
}
