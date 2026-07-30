package com.clb.charity.common.ratelimit;

import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SlidingWindowRateLimiterTest {

    private final SlidingWindowRateLimiter limiter = new SlidingWindowRateLimiter();

    @Test
    void allow_permitsUpToMaxCount_thenBlocks() {
        for (int i = 0; i < 3; i++) {
            assertTrue(limiter.allow("test", "1.1.1.1", 3, Duration.ofMinutes(1)));
        }
        assertFalse(limiter.allow("test", "1.1.1.1", 3, Duration.ofMinutes(1)));
    }

    @Test
    void allow_scopesBucketsByLimiterId_soOneLimiterDoesNotBlockAnother() {
        for (int i = 0; i < 2; i++) {
            assertTrue(limiter.allow("limiter-a", "same-key", 2, Duration.ofMinutes(1)));
        }
        assertFalse(limiter.allow("limiter-a", "same-key", 2, Duration.ofMinutes(1)));
        // A different limiterId with the same key has its own independent bucket.
        assertTrue(limiter.allow("limiter-b", "same-key", 2, Duration.ofMinutes(1)));
    }

    @Test
    void allow_permitsAgain_onceTheWindowElapses() throws InterruptedException {
        assertTrue(limiter.allow("expiry", "1.1.1.1", 1, Duration.ofMillis(150)));
        assertFalse(limiter.allow("expiry", "1.1.1.1", 1, Duration.ofMillis(150)));
        Thread.sleep(200);
        assertTrue(limiter.allow("expiry", "1.1.1.1", 1, Duration.ofMillis(150)));
    }
}
