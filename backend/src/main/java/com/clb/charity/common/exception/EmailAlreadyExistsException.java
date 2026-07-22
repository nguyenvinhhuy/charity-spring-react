package com.clb.charity.common.exception;

import org.springframework.http.HttpStatus;

public class EmailAlreadyExistsException extends ApiException {

    public EmailAlreadyExistsException(String email) {
        super(HttpStatus.CONFLICT,
                "Email Already Exists",
                ProblemTypes.BASE + "/email-already-exists",
                "A member with email '" + email + "' already exists");
    }
}
