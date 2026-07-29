package com.clb.charity.monitoring.dto.response;

import java.time.Instant;

/**
 * A single time-series sample (e.g. Render CPU or memory usage at a point in time).
 *
 * @param timestamp when this sample was recorded
 * @param value the sample value (percentage or byte count, depending on the series)
 */
public record MetricPoint(Instant timestamp, double value) {
}
