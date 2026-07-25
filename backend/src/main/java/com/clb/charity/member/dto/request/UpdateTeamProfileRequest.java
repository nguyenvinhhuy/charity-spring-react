package com.clb.charity.member.dto.request;

import jakarta.validation.constraints.Size;
import org.jspecify.annotations.Nullable;

/**
 * Sets or clears a member's public "team" display fields (ADMIN only).
 */
public record UpdateTeamProfileRequest(
        @Nullable @Size(max = 100) String leadershipTitle,
        @Nullable Integer teamDisplayOrder
) {
}
