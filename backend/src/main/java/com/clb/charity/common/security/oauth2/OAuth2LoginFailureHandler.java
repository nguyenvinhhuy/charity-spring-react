package com.clb.charity.common.security.oauth2;

import com.clb.charity.common.config.AppProperties;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Redirects the browser to the frontend failure URL when social login fails.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginFailureHandler implements AuthenticationFailureHandler {

    private final AppProperties appProperties;

    /**
     * Logs the cause and redirects to the configured failure URL.
     *
     * @param request the current request
     * @param response the current response
     * @param exception the authentication failure
     * @throws IOException if the redirect cannot be written
     */
    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {
        log.warn("Social login failed: {}", exception.getMessage());
        response.sendRedirect(appProperties.oauth2().failureRedirect());
    }
}
