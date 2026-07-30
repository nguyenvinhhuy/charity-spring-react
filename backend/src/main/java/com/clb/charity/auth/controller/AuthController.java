package com.clb.charity.auth.controller;

import com.clb.charity.auth.dto.request.LoginRequest;
import com.clb.charity.auth.dto.request.RegisterRequest;
import com.clb.charity.auth.dto.response.LoginResponse;
import com.clb.charity.auth.dto.response.RefreshResponse;
import com.clb.charity.auth.service.AuthService;
import com.clb.charity.common.security.AuthPrincipal;
import com.clb.charity.common.security.JwtTokenProvider;
import com.clb.charity.common.util.ClientIpUtil;
import com.clb.charity.member.dto.request.ChangePasswordRequest;
import com.clb.charity.member.dto.request.UpdateProfileRequest;
import com.clb.charity.member.dto.response.MemberResponse;
import com.clb.charity.member.service.MemberService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String REFRESH_COOKIE = "refresh_token";
    private static final String COOKIE_PATH = "/api/v1/auth";
    private static final String SAME_SITE = "Lax";

    private final AuthService authService;
    private final MemberService memberService;
    private final JwtTokenProvider tokenProvider;

    /**
     * Registers a new MEMBER account and logs the caller in, setting the refresh cookie.
     *
     * @param request the registration fields
     * @param httpRequest the raw HTTP request, used to resolve the client IP for rate-limiting
     * @return the access-token body with the refresh cookie header
     */
    @Operation(summary = "Register a new account (role MEMBER) and receive an access token")
    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@Valid @RequestBody RegisterRequest request,
                                                   HttpServletRequest httpRequest) {
        AuthService.LoginResult result = authService.register(request, ClientIpUtil.resolve(httpRequest));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(result.refreshToken()).toString())
                .body(result.body());
    }

    /**
     * Authenticates the caller and sets the refresh token as an HttpOnly cookie.
     *
     * @param request the login credentials
     * @param httpRequest the raw HTTP request, used to resolve the client IP for rate-limiting
     * @return the access-token body with the refresh cookie header
     */
    @Operation(summary = "Authenticate and receive an access token (refresh token set as HttpOnly cookie)")
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request,
                                                HttpServletRequest httpRequest) {
        AuthService.LoginResult result =
                authService.login(request.email(), request.password(), ClientIpUtil.resolve(httpRequest));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(result.refreshToken()).toString())
                .body(result.body());
    }

    /**
     * Rotates the refresh cookie and issues a new access token.
     *
     * @param refreshToken the current refresh token from the cookie
     * @return the access-token body with the rotated refresh cookie header
     */
    @Operation(summary = "Rotate the refresh cookie and issue a new access token")
    @PostMapping("/refresh")
    public ResponseEntity<RefreshResponse> refresh(
            @CookieValue(value = REFRESH_COOKIE, required = false) String refreshToken) {
        AuthService.RefreshResult result = authService.refresh(refreshToken);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(result.refreshToken()).toString())
                .body(result.body());
    }

    /**
     * Revokes the refresh token and clears the cookie.
     *
     * @param refreshToken the current refresh token from the cookie
     * @return an empty 204 response clearing the refresh cookie
     */
    @Operation(summary = "Revoke the refresh token and clear the cookie")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(value = REFRESH_COOKIE, required = false) String refreshToken) {
        authService.logout(refreshToken);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearRefreshCookie().toString())
                .build();
    }

    /**
     * Returns the currently authenticated member.
     *
     * @param principal the authenticated principal
     * @return the member representation
     */
    @Operation(summary = "Get the currently authenticated member")
    @GetMapping("/me")
    public MemberResponse me(@AuthenticationPrincipal AuthPrincipal principal) {
        return memberService.getById(principal.memberId());
    }

    /**
     * Updates the authenticated member's own profile.
     *
     * @param principal the authenticated principal
     * @param request the new profile values
     * @return the updated member representation
     */
    @Operation(summary = "Update the current member's profile")
    @PutMapping("/me")
    public MemberResponse updateMe(@AuthenticationPrincipal AuthPrincipal principal,
                                   @Valid @RequestBody UpdateProfileRequest request) {
        return memberService.updateProfile(principal.memberId(), request);
    }

    /**
     * Changes the authenticated member's password.
     *
     * @param principal the authenticated principal
     * @param request the current and new passwords
     * @return an empty 204 response
     */
    @Operation(summary = "Change the current member's password")
    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(@AuthenticationPrincipal AuthPrincipal principal,
                                               @Valid @RequestBody ChangePasswordRequest request) {
        memberService.changePassword(principal.memberId(), request);
        return ResponseEntity.noContent().build();
    }

    /**
     * Builds the refresh-token cookie holding the given value.
     *
     * @param token the refresh token value
     * @return the configured refresh cookie
     */
    private ResponseCookie buildRefreshCookie(String token) {
        return ResponseCookie.from(REFRESH_COOKIE, token)
                .httpOnly(true)
                .secure(true)
                .path(COOKIE_PATH)
                .sameSite(SAME_SITE)
                .maxAge(tokenProvider.getRefreshTokenExpirySeconds())
                .build();
    }

    /**
     * Builds an expired refresh cookie used to clear it on the client.
     *
     * @return the cleared refresh cookie
     */
    private ResponseCookie clearRefreshCookie() {
        return ResponseCookie.from(REFRESH_COOKIE, "")
                .httpOnly(true)
                .secure(true)
                .path(COOKIE_PATH)
                .sameSite(SAME_SITE)
                .maxAge(0)
                .build();
    }
}
