package com.clb.charity.monitoring.domain;

/**
 * The 4 external services tracked by the monitoring dashboard, used as the debounce key for alert emails.
 */
public enum MonitoringResource {
    RENDER,
    VERCEL,
    DATABASE,
    CLOUDINARY
}
