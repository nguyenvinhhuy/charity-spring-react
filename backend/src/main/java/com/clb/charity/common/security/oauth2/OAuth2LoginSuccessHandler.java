package com.clb.charity.common.security.oauth2;

import com.clb.charity.auth.service.AuthService;
import com.clb.charity.common.config.AppProperties;
import com.clb.charity.common.security.JwtTokenProvider;
import com.clb.charity.member.domain.AuthProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

/**
 * Handles a successful social login: upserts the member, sets the refresh cookie, and redirects to the frontend.
 */
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private static final String REFRESH_COOKIE = "refresh_token";
    private static final String COOKIE_PATH = "/api/v1/auth";
    // None (not Lax) because the frontend and backend are deployed on different origins.
    private static final String SAME_SITE = "None";

    private final AuthService authService;
    private final JwtTokenProvider tokenProvider;
    private final AppProperties appProperties;

    /**
     * Upserts the authenticated social profile and redirects the browser to the frontend callback.
     *
     * @param request the current request
     * @param response the current response
     * @param authentication the completed OAuth2 authentication
     * @throws IOException if the redirect cannot be written
     */
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
        String registrationId = token.getAuthorizedClientRegistrationId();
        OAuth2User user = token.getPrincipal();

        SocialProfile profile = extractProfile(registrationId, user.getAttributes());

        AuthService.LoginResult result = authService.loginWithOAuth(
                profile.provider(), profile.providerId(), profile.email(), profile.name(), profile.avatarUrl());

        response.addHeader(HttpHeaders.SET_COOKIE, buildRefreshCookie(result.refreshToken()).toString());
        response.sendRedirect(appProperties.oauth2().successRedirect());
    }

    /** Maps a provider's raw attributes into a normalized profile. */
    private SocialProfile extractProfile(String registrationId, Map<String, Object> attrs) {
        return switch (registrationId) {
            case "google" -> new SocialProfile(
                    AuthProvider.GOOGLE,
                    String.valueOf(attrs.get("sub")),
                    (String) attrs.get("email"),
                    (String) attrs.get("name"),
                    (String) attrs.get("picture"));
            case "facebook" -> new SocialProfile(
                    AuthProvider.FACEBOOK,
                    String.valueOf(attrs.get("id")),
                    (String) attrs.get("email"),
                    (String) attrs.get("name"),
                    facebookPicture(attrs));
            default -> throw new IllegalStateException("Unsupported OAuth2 provider: " + registrationId);
        };
    }

    /** Facebook returns the avatar nested as picture.data.url. */
    @SuppressWarnings("unchecked")
    private String facebookPicture(Map<String, Object> attrs) {
        Object picture = attrs.get("picture");
        if (picture instanceof Map<?, ?> pictureMap
                && pictureMap.get("data") instanceof Map<?, ?> data) {
            return (String) ((Map<String, Object>) data).get("url");
        }
        return null;
    }

    private ResponseCookie buildRefreshCookie(String token) {
        return ResponseCookie.from(REFRESH_COOKIE, token)
                .httpOnly(true)
                .secure(true)
                .path(COOKIE_PATH)
                .sameSite(SAME_SITE)
                .maxAge(tokenProvider.getRefreshTokenExpirySeconds())
                .build();
    }

    /** Normalized social profile fields used to upsert a member. */
    private record SocialProfile(AuthProvider provider, String providerId, String email, String name,
                                 String avatarUrl) {
    }
}
