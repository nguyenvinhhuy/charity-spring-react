package com.clb.charity.common.exception;

import org.springframework.http.HttpStatus;

public class InvalidFileException extends ApiException {

    public InvalidFileException(String detail) {
        super(HttpStatus.BAD_REQUEST,
                "Invalid File",
                ProblemTypes.BASE + "/invalid-file",
                detail);
    }
}
