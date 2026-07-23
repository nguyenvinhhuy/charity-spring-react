package com.clb.charity.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Covers all rejected registration actions (already registered, capacity full, registration
 * not open for this campaign, past the cancel cutoff) with a reason-specific message.
 */
public class RegistrationRequestException extends ApiException {

    public RegistrationRequestException(String reason) {
        super(HttpStatus.BAD_REQUEST,
                "Registration Request Rejected",
                ProblemTypes.BASE + "/registration-request-rejected",
                reason);
    }
}
