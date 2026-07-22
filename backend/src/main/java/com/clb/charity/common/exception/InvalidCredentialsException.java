package com.clb.charity.common.exception;

import org.springframework.http.HttpStatus;

public class InvalidCredentialsException extends ApiException {

    public InvalidCredentialsException() {
        super(HttpStatus.UNAUTHORIZED,
                "Invalid Credentials",
                ProblemTypes.BASE + "/invalid-credentials",
                "Email or password is incorrect");
    }
}
