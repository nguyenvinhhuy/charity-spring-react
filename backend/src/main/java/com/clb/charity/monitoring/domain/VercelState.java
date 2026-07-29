package com.clb.charity.monitoring.domain;

/**
 * High-level status of the most recent Vercel deployment, as shown on the monitoring dashboard.
 */
public enum VercelState {
    READY,
    BUILDING,
    ERROR,
    NOT_CONFIGURED
}
