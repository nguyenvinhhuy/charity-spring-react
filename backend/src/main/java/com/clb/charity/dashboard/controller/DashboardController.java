package com.clb.charity.dashboard.controller;

import com.clb.charity.common.model.Granularity;
import com.clb.charity.dashboard.dto.response.DashboardResponse;
import com.clb.charity.dashboard.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * Returns the aggregated dashboard summary.
     *
     * @param granularity the time bucket for the donation series (defaults to monthly)
     * @return the dashboard summary
     */
    @Operation(summary = "Get the aggregated dashboard summary")
    @GetMapping("/summary")
    public DashboardResponse summary(@RequestParam(defaultValue = "MONTH") Granularity granularity) {
        return dashboardService.summary(granularity);
    }
}
