package com.clb.charity.member.dto.response;

import com.clb.charity.member.domain.Role;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Public representation of a member. Never exposes the password hash.
 *
 * <p>{@code dateOfBirth}, {@code address}, and {@code nationalId} are sensitive fields — only
 * returned to the member themselves (via {@code /auth/me}) or to an ADMIN caller; the single-member
 * and list endpoints that could expose them to other roles are restricted accordingly in
 * {@code SecurityConfig}.
 */
public record MemberResponse(
        Long id,
        String fullName,
        String email,
        Role role,
        @Nullable String avatarUrl,
        @Nullable String phone,
        @Nullable String bio,
        @Nullable LocalDate dateOfBirth,
        @Nullable String address,
        @Nullable String nationalId,
        @Nullable String leadershipTitle,
        @Nullable Integer teamDisplayOrder,
        boolean isActive,
        Instant createdAt
) {
}
