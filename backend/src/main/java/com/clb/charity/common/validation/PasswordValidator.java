package com.clb.charity.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Validates a password against {@link PasswordPolicy}: length bounds plus uppercase/digit/special
 * character presence.
 */
public class PasswordValidator implements ConstraintValidator<ValidPassword, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        // Presence is @NotBlank's job; a null/blank value passes here so the two annotations don't
        // produce duplicate error messages for the same missing-value case.
        if (value == null || value.isBlank()) {
            return true;
        }
        if (value.length() < PasswordPolicy.MIN_LENGTH || value.length() > PasswordPolicy.MAX_LENGTH) {
            return false;
        }
        boolean hasUppercase = value.chars().anyMatch(Character::isUpperCase);
        boolean hasDigit = value.chars().anyMatch(Character::isDigit);
        boolean hasSpecial = value.chars().anyMatch(c -> PasswordPolicy.SPECIAL_CHARS.indexOf(c) >= 0);
        return hasUppercase && hasDigit && hasSpecial;
    }
}
