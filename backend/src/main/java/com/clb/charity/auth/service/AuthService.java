package com.clb.charity.auth.service;

import com.clb.charity.auth.dto.request.RegisterRequest;
import com.clb.charity.auth.dto.response.LoginResponse;
import com.clb.charity.auth.dto.response.RefreshResponse;
import com.clb.charity.member.domain.AuthProvider;
import org.jspecify.annotations.Nullable;

/**
 * Authentication: registration, login, refresh-token rotation and logout.
 */
public interface AuthService {

    /** Body to return plus the opaque refresh token to set as an HttpOnly cookie. */
    record LoginResult(LoginResponse body, String refreshToken) {
    }

    /** Access-token body to return plus the rotated refresh token for the cookie. */
    record RefreshResult(RefreshResponse body, String refreshToken) {
    }

    /**
     * Registers a new member with the MEMBER role and immediately issues tokens (auto-login).
     *
     * @param request the registration fields (full name, email, raw password)
     * @param clientIp the caller's IP, used to rate-limit registrations
     * @return the login body and the opaque refresh token
     */
    LoginResult register(RegisterRequest request, String clientIp);

    /**
     * Authenticates a member and issues a new access and refresh token.
     *
     * @param email the member email
     * @param rawPassword the raw password to verify
     * @param clientIp the caller's IP, used to rate-limit login attempts
     * @return the login body and the opaque refresh token
     */
    LoginResult login(String email, String rawPassword, String clientIp);

    /**
     * Upserts a member from a verified OAuth2 profile (linking by email) and issues tokens.
     *
     * @param provider the identity provider
     * @param providerId the provider's stable user id
     * @param email the account email
     * @param fullName the display name
     * @param avatarUrl the profile picture URL, or null
     * @return the login body and the opaque refresh token
     */
    LoginResult loginWithOAuth(AuthProvider provider, String providerId, String email, @Nullable String fullName,
                               @Nullable String avatarUrl);

    /**
     * Rotates the given refresh token and issues a new access token.
     *
     * @param rawRefreshToken the current opaque refresh token
     * @return the refresh body and the newly rotated refresh token
     */
    RefreshResult refresh(String rawRefreshToken);

    /**
     * Revokes the given refresh token if present.
     *
     * @param rawRefreshToken the opaque refresh token to revoke, may be null or blank
     */
    void logout(String rawRefreshToken);

    /**
     * Revokes every refresh token issued to the given member, so previously-issued sessions stop working.
     *
     * @param memberId the member whose sessions should be revoked
     */
    void revokeAllTokensForMember(Long memberId);
}
