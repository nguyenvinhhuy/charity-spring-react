package com.clb.charity.common.validation;

/**
 * Central definition of the password length bounds, shared by {@link ValidPassword} and the
 * error message so the two can never drift apart.
 */
public final class PasswordPolicy {

    public static final int MIN_LENGTH = 8;
    public static final int MAX_LENGTH = 100;
    static final String SPECIAL_CHARS = "!@#$%^&*()_+-=[]{};':\",./<>?";

    private PasswordPolicy() {
    }
}
