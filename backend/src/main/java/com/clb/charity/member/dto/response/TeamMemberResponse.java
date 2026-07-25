package com.clb.charity.member.dto.response;

import org.jspecify.annotations.Nullable;

/**
 * Public-safe representation of a member featured on the About page's team section.
 */
public record TeamMemberResponse(
        Long id,
        String fullName,
        @Nullable String avatarUrl,
        @Nullable String bio,
        String leadershipTitle
) {
}
