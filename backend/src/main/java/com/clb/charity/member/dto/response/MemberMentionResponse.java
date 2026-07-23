package com.clb.charity.member.dto.response;

import org.jspecify.annotations.Nullable;

public record MemberMentionResponse(
        Long id,
        String fullName,
        @Nullable String avatarUrl
) {
}
