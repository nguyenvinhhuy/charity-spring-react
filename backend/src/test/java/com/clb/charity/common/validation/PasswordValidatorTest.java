package com.clb.charity.common.validation;

import com.clb.charity.auth.dto.request.RegisterRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PasswordValidatorTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    void rejectsPasswordMissingUppercaseDigitOrSpecialChar() {
        assertHasPasswordViolation("lowercase1!"); // no uppercase
        assertHasPasswordViolation("NoDigits!!"); // no digit
        assertHasPasswordViolation("NoSpecial1"); // no special character
    }

    @Test
    void rejectsPasswordOutsideLengthBounds() {
        assertHasPasswordViolation("Aa1!aaa"); // 7 chars, below the 8 minimum
        assertHasPasswordViolation("Aa1!" + "a".repeat(97)); // 101 chars, above the 100 maximum
    }

    @Test
    void acceptsAPasswordMeetingEveryRule() {
        Set<ConstraintViolation<RegisterRequest>> violations = validate("Str0ng!Pass");
        assertFalse(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("password")));
    }

    private void assertHasPasswordViolation(String password) {
        Set<ConstraintViolation<RegisterRequest>> violations = validate(password);
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("password")));
    }

    private Set<ConstraintViolation<RegisterRequest>> validate(String password) {
        return validator.validate(new RegisterRequest("Test User", "test@example.com", password));
    }
}
