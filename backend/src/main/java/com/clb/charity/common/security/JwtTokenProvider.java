package com.clb.charity.common.security;

import com.clb.charity.common.config.AppProperties;
import com.clb.charity.member.domain.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

/**
 * Issues and validates short-lived JWT access tokens (HS256) and mints opaque refresh-token strings.
 */
@Component
@Slf4j
public class JwtTokenProvider {

    private static final String CLAIM_EMAIL = "email";
    private static final String CLAIM_ROLE = "role";

    private final AppProperties appProperties;
    private final SecretKey key;

    public JwtTokenProvider(AppProperties appProperties) {
        this.appProperties = appProperties;
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(appProperties.jwt().secret()));
    }

    public long getAccessTokenExpirySeconds() {
        return appProperties.jwt().accessTokenExpiry();
    }

    public long getRefreshTokenExpirySeconds() {
        return appProperties.jwt().refreshTokenExpiry();
    }

    public String createAccessToken(Long memberId, String email, Role role) {
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(appProperties.jwt().accessTokenExpiry());
        return Jwts.builder()
                .subject(String.valueOf(memberId))
                .claim(CLAIM_EMAIL, email)
                .claim(CLAIM_ROLE, role.name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(key)
                .compact();
    }

    /** A random, opaque refresh token stored server-side. */
    public String createRefreshToken() {
        return UUID.randomUUID().toString() + UUID.randomUUID();
    }

    /** Parse and verify the token, returning its claims, or {@code null} if invalid/expired. */
    public @Nullable Claims parseClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException ex) {
            log.debug("Rejected JWT: {}", ex.getMessage());
            return null;
        }
    }

    public AuthPrincipal toPrincipal(Claims claims) {
        return new AuthPrincipal(
                Long.valueOf(claims.getSubject()),
                claims.get(CLAIM_EMAIL, String.class),
                Role.valueOf(claims.get(CLAIM_ROLE, String.class)));
    }
}
