package com.clb.charity.monitoring.domain;

/**
 * A selectable time window for the Render/Vercel trend charts.
 */
public enum MetricRange {
    // Resolution grows coarser as the window widens, so every range renders roughly the same point count.
    TWELVE_HOURS(12L * 3600, 5 * 60),
    ONE_DAY(24L * 3600, 15 * 60),
    THREE_DAYS(3L * 24 * 3600, 30 * 60),
    SEVEN_DAYS(7L * 24 * 3600, 60 * 60);

    private final long lookbackSeconds;
    private final long resolutionSeconds;

    MetricRange(long lookbackSeconds, long resolutionSeconds) {
        this.lookbackSeconds = lookbackSeconds;
        this.resolutionSeconds = resolutionSeconds;
    }

    public long lookbackSeconds() {
        return lookbackSeconds;
    }

    public long resolutionSeconds() {
        return resolutionSeconds;
    }
}
