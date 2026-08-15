package com.clb.charity.monitoring.domain;

/**
 * The 3 external services tracked by the monitoring dashboard, used as the debounce key for alert emails.
 */
public enum MonitoringResource {
    RENDER,
    DATABASE,
    CLOUDINARY
}
