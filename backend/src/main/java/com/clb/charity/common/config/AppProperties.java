package com.clb.charity.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Arrays;
import java.util.List;

/**
 * Strongly-typed binding for the {@code app.*} block in application.yml.
 */
@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Minio minio, Cors cors, Bank bank, OAuth2 oauth2) {

    public record Jwt(
            /** Base64-encoded HS256 secret (>= 32 bytes decoded). */
            String secret,
            /** Access token lifetime in seconds. */
            long accessTokenExpiry,
            /** Refresh token lifetime in seconds. */
            long refreshTokenExpiry
    ) {
    }

    public record Minio(
            /** Endpoint the backend uses to reach MinIO (e.g. http://minio:9000 in Docker). */
            String endpoint,
            /** Base URL handed to clients for stored objects (browser-reachable). */
            String publicEndpoint,
            String accessKey,
            String secretKey,
            String bucket
    ) {
    }

    public record Cors(
            /** Comma-separated list of allowed frontend origins. */
            String allowedOrigins
    ) {
        public List<String> originList() {
            return Arrays.stream(allowedOrigins.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        }
    }

    public record Bank(String accountNo, String accountName) {
    }

    public record OAuth2(
            /** Frontend URL to redirect to after a successful social login. */
            String successRedirect,
            /** Frontend URL to redirect to after a failed social login. */
            String failureRedirect
    ) {
    }
}
