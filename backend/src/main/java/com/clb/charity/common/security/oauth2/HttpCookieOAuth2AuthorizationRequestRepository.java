package com.clb.charity.common.security.oauth2;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectInputFilter;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.util.Arrays;
import java.util.Base64;
import java.util.Optional;

/**
 * Stores the in-flight OAuth2 authorization request in a short-lived cookie instead of the HTTP
 * session, so social login works with a stateless session policy.
 */
@Component
public class HttpCookieOAuth2AuthorizationRequestRepository
        implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    public static final String AUTH_REQUEST_COOKIE = "oauth2_auth_request";
    private static final int COOKIE_MAX_AGE_SECONDS = 180;
    // Only allow deserializing the OAuth2 request graph; block arbitrary gadget classes.
    private static final ObjectInputFilter DESERIALIZE_FILTER =
            ObjectInputFilter.Config.createFilter("org.springframework.security.oauth2.**;java.**;!*");

    /**
     * Reads the pending authorization request from the request cookie.
     *
     * @param request the current request
     * @return the stored authorization request, or null when absent
     */
    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        return findCookie(request).map(this::deserialize).orElse(null);
    }

    /**
     * Saves the authorization request into a cookie, or clears it when null.
     *
     * @param authorizationRequest the request to persist, or null to clear
     * @param request the current request
     * @param response the current response
     */
    @Override
    public void saveAuthorizationRequest(OAuth2AuthorizationRequest authorizationRequest,
                                         HttpServletRequest request, HttpServletResponse response) {
        if (authorizationRequest == null) {
            writeCookie(response, "", 0);
            return;
        }
        writeCookie(response, serialize(authorizationRequest), COOKIE_MAX_AGE_SECONDS);
    }

    /**
     * Removes and returns the pending authorization request.
     *
     * @param request the current request
     * @param response the current response
     * @return the removed authorization request, or null when absent
     */
    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request,
                                                                 HttpServletResponse response) {
        OAuth2AuthorizationRequest authorizationRequest = loadAuthorizationRequest(request);
        if (authorizationRequest != null) {
            writeCookie(response, "", 0);
        }
        return authorizationRequest;
    }

    private Optional<Cookie> findCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }
        return Arrays.stream(request.getCookies())
                .filter(c -> AUTH_REQUEST_COOKIE.equals(c.getName()))
                .findFirst();
    }

    private void writeCookie(HttpServletResponse response, String value, int maxAge) {
        ResponseCookie cookie = ResponseCookie.from(AUTH_REQUEST_COOKIE, value)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .sameSite("Lax")
                .maxAge(maxAge)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private String serialize(OAuth2AuthorizationRequest authorizationRequest) {
        try (ByteArrayOutputStream bos = new ByteArrayOutputStream();
             ObjectOutputStream oos = new ObjectOutputStream(bos)) {
            oos.writeObject(authorizationRequest);
            oos.flush();
            return Base64.getUrlEncoder().encodeToString(bos.toByteArray());
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to serialize OAuth2 authorization request", ex);
        }
    }

    private OAuth2AuthorizationRequest deserialize(Cookie cookie) {
        try (ByteArrayInputStream bis = new ByteArrayInputStream(Base64.getUrlDecoder().decode(cookie.getValue()));
             ObjectInputStream ois = new ObjectInputStream(bis)) {
            ois.setObjectInputFilter(DESERIALIZE_FILTER);
            return (OAuth2AuthorizationRequest) ois.readObject();
        } catch (Exception ex) {
            return null;
        }
    }
}
