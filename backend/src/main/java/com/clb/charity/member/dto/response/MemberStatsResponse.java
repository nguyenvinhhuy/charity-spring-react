package com.clb.charity.member.dto.response;

import com.clb.charity.member.domain.Role;

import java.util.List;

/**
 * Aggregated member counts for the dashboard.
 */
public record MemberStatsResponse(
        long total,
        List<RoleCount> byRole
) {

    public record RoleCount(Role role, long count) {
    }
}
