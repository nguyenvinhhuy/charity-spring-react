package com.clb.charity.dashboard.service;

import com.clb.charity.common.model.Granularity;
import com.clb.charity.dashboard.dto.response.DashboardResponse;

/**
 * Composes cross-feature figures into a single dashboard summary.
 */
public interface DashboardService {

    /**
     * Builds the dashboard summary with the donation series bucketed at the given granularity.
     *
     * @param granularity the time bucket for the donation series
     * @return the dashboard summary
     */
    DashboardResponse summary(Granularity granularity);
}
