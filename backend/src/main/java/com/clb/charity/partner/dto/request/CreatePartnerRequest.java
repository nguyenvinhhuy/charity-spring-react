package com.clb.charity.partner.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.Nullable;

public record CreatePartnerRequest(
        @NotBlank @Size(max = 150) String name,
        @NotBlank @Size(max = 500) String logoUrl,
        @Size(max = 500) @Nullable String websiteUrl,
        @Nullable Integer displayOrder
) {
}
