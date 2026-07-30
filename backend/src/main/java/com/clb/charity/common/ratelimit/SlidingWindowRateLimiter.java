package com.clb.charity.common.ratelimit;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.TimeUnit;

/**
 * In-memory per-key sliding-window rate limiter shared by every feature that needs one (single
 * backend instance, no external cache needed).
 */
@Component
@Slf4j
public class SlidingWindowRateLimiter {

    // Buckets idle past this are swept so the map doesn't grow forever as new keys appear.
    private static final Duration BUCKET_IDLE_TTL = Duration.ofHours(24);

    private record BucketKey(String limiterId, String key) {
    }

    private final Map<BucketKey, Deque<Instant>> windows = new ConcurrentHashMap<>();

    /**
     * Records an attempt for the given limiter/key pair and reports whether it is within the limit.
     *
     * @param limiterId a stable name identifying which feature owns this limiter (e.g. "login-ip")
     * @param key        the bucket key (e.g. an IP address or email), scoped within limiterId
     * @param maxCount   the maximum number of attempts allowed within the window
     * @param window     the sliding time window
     * @return true if the attempt is allowed, false if the limit has been reached
     */
    public boolean allow(String limiterId, String key, int maxCount, Duration window) {
        Deque<Instant> timestamps = windows.computeIfAbsent(
                new BucketKey(limiterId, key), k -> new ConcurrentLinkedDeque<>());
        synchronized (timestamps) {
            Instant cutoff = Instant.now().minus(window);
            while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(cutoff)) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= maxCount) {
                return false;
            }
            timestamps.addLast(Instant.now());
            return true;
        }
    }

    /**
     * Drops any bucket whose most recent attempt is older than {@link #BUCKET_IDLE_TTL}.
     */
    @Scheduled(fixedRate = 30, timeUnit = TimeUnit.MINUTES)
    void evictStaleBuckets() {
        Instant cutoff = Instant.now().minus(BUCKET_IDLE_TTL);
        int removed = 0;
        for (Map.Entry<BucketKey, Deque<Instant>> entry : windows.entrySet()) {
            Deque<Instant> timestamps = entry.getValue();
            synchronized (timestamps) {
                Instant last = timestamps.peekLast();
                if (last == null || last.isBefore(cutoff)) {
                    windows.remove(entry.getKey());
                    removed++;
                }
            }
        }
        if (removed > 0) {
            log.info("Evicted {} stale rate-limit buckets", removed);
        }
    }
}
