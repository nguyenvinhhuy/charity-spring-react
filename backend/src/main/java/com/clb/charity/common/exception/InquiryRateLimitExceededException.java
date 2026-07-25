package com.clb.charity.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when the same client IP submits more contact-form inquiries than the hourly limit allows.
 */
public class InquiryRateLimitExceededException extends ApiException {

    public InquiryRateLimitExceededException() {
        super(HttpStatus.TOO_MANY_REQUESTS,
                "Too Many Inquiries",
                ProblemTypes.BASE + "/inquiry-rate-limit-exceeded",
                "Too many contact requests sent recently, please try again later");
    }
}
