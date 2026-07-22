package com.clb.charity.common.security;

import com.clb.charity.member.domain.Role;

/**
 * Authenticated principal placed in the SecurityContext by {@link JwtAuthFilter}.
 * Inject into controllers with {@code @AuthenticationPrincipal}.
 */
public record AuthPrincipal(Long memberId, String email, Role role) {
}
