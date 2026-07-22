package com.clb.charity.auth.dto.response;

public record RefreshResponse(
        String accessToken,
        String tokenType,
        long expiresIn
) {
}
