package com.clb.charity.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Base type for all domain exceptions. Carries everything the
 * {@link GlobalExceptionHandler} needs to build an RFC 9457 ProblemDetail.
 */
public abstract class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String problemTitle;
    private final String problemType;

    protected ApiException(HttpStatus status, String problemTitle, String problemType, String message) {
        super(message);
        this.status = status;
        this.problemTitle = problemTitle;
        this.problemType = problemType;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getProblemTitle() {
        return problemTitle;
    }

    public String getProblemType() {
        return problemType;
    }
}
