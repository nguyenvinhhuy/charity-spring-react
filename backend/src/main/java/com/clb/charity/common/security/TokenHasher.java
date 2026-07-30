package com.clb.charity.common.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * Hashes high-entropy opaque tokens (not passwords) for at-rest storage.
 */
public final class TokenHasher {

    private TokenHasher() {
    }

    /**
     * Hashes a raw token with SHA-256, hex-encoded.
     *
     * @param rawToken the token as issued to the client
     * @return the hex-encoded SHA-256 digest
     */
    public static String sha256Hex(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 algorithm not available", ex);
        }
    }
}
