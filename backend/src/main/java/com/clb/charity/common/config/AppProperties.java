package com.clb.charity.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Arrays;
import java.util.List;

/**
 * Strongly-typed binding for the {@code app.*} block in application.yml.
 */
@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Cloudinary cloudinary, Cors cors, OAuth2 oauth2, Render render, Vercel vercel, Alert alert) {

    public record Jwt(
            /** Base64-encoded HS256 secret (>= 32 bytes decoded). */
            String secret,
            /** Access token lifetime in seconds. */
            long accessTokenExpiry,
            /** Refresh token lifetime in seconds. */
            long refreshTokenExpiry
    ) {
    }

    public record Cloudinary(
            String cloudName,
            String apiKey,
            String apiSecret,
            /** Folder prefix under which every uploaded image is stored in the Cloudinary account. */
            String uploadFolder
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

    public record OAuth2(
            /** Frontend URL to redirect to after a successful social login. */
            String successRedirect,
            /** Frontend URL to redirect to after a failed social login. */
            String failureRedirect
    ) {
    }

    public record Render(
            /** Render personal API key (Bearer token). Blank means the Render card is not configured. */
            String apiKey,
            /** The Render service id (e.g. {@code srv-xxxx}) to query metrics/deploys for. */
            String serviceId
    ) {
    }

    public record Vercel(
            /** Vercel access token (Bearer token). Blank means the Vercel card is not configured. */
            String apiToken,
            /** The Vercel project id to query deployments for. */
            String projectId
    ) {
    }

    public record Alert(
            /** Resend API key (Bearer token). Blank disables email alerts entirely. */
            String resendApiKey,
            /** Destination address for threshold/error alert emails. */
            String emailTo,
            /** Sender address; Resend's shared sandbox sender works with no domain verification. */
            String emailFrom,
            /** Fraction (0-1) of a resource's quota that triggers an alert. */
            double thresholdFraction,
            /** Supabase free-tier database size limit, in bytes, used to compute the usage fraction. */
            long databaseLimitBytes,
            /** Cloudinary free-tier storage limit, in bytes, used to compute the usage fraction. */
            long cloudinaryLimitBytes
    ) {
    }
}
