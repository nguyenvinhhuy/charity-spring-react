package com.clb.charity.monitoring.domain;

/**
 * High-level status of the Render-hosted backend service, as shown on the monitoring dashboard.
 */
public enum RenderState {
    LIVE,
    SUSPENDED,
    ERROR,
    NOT_CONFIGURED
}
