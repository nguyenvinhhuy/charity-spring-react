package com.clb.charity.monitoring.service;

import com.clb.charity.monitoring.domain.MetricRange;
import com.clb.charity.monitoring.dto.response.MonitoringOverviewResponse;

public interface MonitoringService {

    /**
     * Fetches the current status of all 4 monitored external services.
     *
     * @param range the time window for the Render/Vercel trend charts
     * @return the aggregated overview
     */
    MonitoringOverviewResponse getOverview(MetricRange range);
}
