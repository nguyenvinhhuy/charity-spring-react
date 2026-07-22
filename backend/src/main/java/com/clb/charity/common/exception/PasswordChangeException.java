package com.clb.charity.common.exception;

import org.springframework.http.HttpStatus;

public class PasswordChangeException extends ApiException {

    public PasswordChangeException(String detail) {
        super(HttpStatus.BAD_REQUEST,
                "Password Change Failed",
                ProblemTypes.BASE + "/password-change-failed",
                detail);
    }
}
