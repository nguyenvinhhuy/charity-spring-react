package com.clb.charity.inquiry.service;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

/**
 * In-memory per-IP sliding-window limiter for the public contact form (single backend instance, no
 * external cache needed).
 */
@Component
public class InquiryRateLimiter {

    private static final int MAX_PER_HOUR = 5;

    private final Map<String, Deque<Instant>> submissionsByIp = new ConcurrentHashMap<>();

    /**
     * Records a submission attempt for the given IP and reports whether it is within the hourly limit.
     *
     * @param ip the client IP address
     * @return true if the submission is allowed, false if the hourly limit has been reached
     */
    public boolean allow(String ip) {
        Deque<Instant> timestamps = submissionsByIp.computeIfAbsent(ip, key -> new ConcurrentLinkedDeque<>());
        synchronized (timestamps) {
            Instant cutoff = Instant.now().minus(1, ChronoUnit.HOURS);
            while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(cutoff)) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= MAX_PER_HOUR) {
                return false;
            }
            timestamps.addLast(Instant.now());
            return true;
        }
    }
}
