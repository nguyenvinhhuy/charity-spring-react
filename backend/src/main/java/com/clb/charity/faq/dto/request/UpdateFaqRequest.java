package com.clb.charity.faq.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.Nullable;

public record UpdateFaqRequest(
        @NotBlank @Size(max = 500) String question,
        @NotBlank String answer,
        @Size(max = 500) @Nullable String questionEn,
        @Nullable String answerEn,
        @Size(max = 100) @Nullable String category,
        int sortOrder
) {
}
