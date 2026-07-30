package com.clb.charity.inquiry.service;

import com.clb.charity.common.ratelimit.SlidingWindowRateLimiter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Per-IP sliding-window limiter for the public contact form.
 */
@Component
@RequiredArgsConstructor
public class InquiryRateLimiter {

    private static final String LIMITER_ID = "inquiry";
    private static final int MAX_PER_HOUR = 5;

    private final SlidingWindowRateLimiter rateLimiter;

    /**
     * Records a submission attempt for the given IP and reports whether it is within the hourly limit.
     *
     * @param ip the client IP address
     * @return true if the submission is allowed, false if the hourly limit has been reached
     */
    public boolean allow(String ip) {
        return rateLimiter.allow(LIMITER_ID, ip, MAX_PER_HOUR, Duration.ofHours(1));
    }
}
