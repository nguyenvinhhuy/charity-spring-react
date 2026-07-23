package com.clb.charity.common.exception;

import org.springframework.http.HttpStatus;

public class RegistrationNotFoundException extends ApiException {

    public RegistrationNotFoundException(String identifier) {
        super(HttpStatus.NOT_FOUND,
                "Registration Not Found",
                ProblemTypes.BASE + "/registration-not-found",
                "No campaign registration found for '" + identifier + "'");
    }
}
