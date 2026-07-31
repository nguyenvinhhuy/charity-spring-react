package com.clb.charity.member.event;

/** Published when a member's sessions must be revoked (password change, forced logout). */
public record MemberSessionsRevokedEvent(Long memberId) {
}
