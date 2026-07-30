package com.clb.charity.common.util;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Resolves the originating client IP address, accounting for a reverse proxy's forwarding header.
 */
public final class ClientIpUtil {

    private static final String FORWARDED_FOR_HEADER = "X-Forwarded-For";

    private ClientIpUtil() {
    }

    public static String resolve(HttpServletRequest request) {
        String forwardedFor = request.getHeader(FORWARDED_FOR_HEADER);
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            // Dead in practice: forward-headers-strategy=framework strips this header first (accepted risk).
            String[] parts = forwardedFor.split(",");
            return parts[parts.length - 1].trim();
        }
        return request.getRemoteAddr();
    }
}
