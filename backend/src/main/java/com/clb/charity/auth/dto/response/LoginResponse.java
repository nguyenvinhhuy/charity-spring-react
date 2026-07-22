package com.clb.charity.auth.dto.response;

import com.clb.charity.member.dto.response.MemberResponse;

public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        MemberResponse member
) {
}
