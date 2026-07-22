package com.clb.charity.common.exception;

import org.springframework.http.HttpStatus;

public class InvalidRefreshTokenException extends ApiException {

    public InvalidRefreshTokenException() {
        super(HttpStatus.UNAUTHORIZED,
                "Invalid Refresh Token",
                ProblemTypes.BASE + "/invalid-refresh-token",
                "The refresh token is missing, invalid, or expired");
    }
}
