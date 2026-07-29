package com.clb.charity.monitoring.domain;

/**
 * A selectable time window for the Render/Vercel trend charts.
 */
public enum MetricRange {
    // Resolution grows coarser as the window widens, so every range renders roughly the same point count.
    ONE_DAY(24L * 3600, 15 * 60),
    SEVEN_DAYS(7L * 24 * 3600, 60 * 60),
    ONE_MONTH(30L * 24 * 3600, 6 * 3600),
    /** As far back as the upstream API actually retains — Render/Vercel free-tier retention, not literally forever. */
    ALL(365L * 24 * 3600, 24 * 3600);

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
