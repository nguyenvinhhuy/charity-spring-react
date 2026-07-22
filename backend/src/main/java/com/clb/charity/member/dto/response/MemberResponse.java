package com.clb.charity.member.dto.response;

import com.clb.charity.member.domain.Role;
import org.jspecify.annotations.Nullable;

import java.time.Instant;

/**
 * Public representation of a member. Never exposes the password hash.
 */
public record MemberResponse(
        Long id,
        String fullName,
        String email,
        Role role,
        @Nullable String avatarUrl,
        @Nullable String phone,
        @Nullable String bio,
        boolean isActive,
        Instant createdAt
) {
}
