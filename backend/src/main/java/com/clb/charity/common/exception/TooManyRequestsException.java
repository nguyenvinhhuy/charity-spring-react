package com.clb.charity.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when a caller exceeds a rate limit enforced by {@link com.clb.charity.common.ratelimit.SlidingWindowRateLimiter}.
 */
public class TooManyRequestsException extends ApiException {

    public TooManyRequestsException(String message) {
        super(HttpStatus.TOO_MANY_REQUESTS,
                "Too Many Requests",
                ProblemTypes.BASE + "/too-many-requests",
                message);
    }
}
