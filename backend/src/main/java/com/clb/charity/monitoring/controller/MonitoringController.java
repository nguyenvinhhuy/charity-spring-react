package com.clb.charity.monitoring.controller;

import com.clb.charity.monitoring.domain.MetricRange;
import com.clb.charity.monitoring.dto.response.MonitoringOverviewResponse;
import com.clb.charity.monitoring.service.MonitoringService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/monitoring")
@RequiredArgsConstructor
public class MonitoringController {

    private final MonitoringService monitoringService;

    /**
     * Returns the current status of Render, Vercel, the database, and Cloudinary (ADMIN only).
     *
     * @param range the time window for the Render/Vercel trend charts
     * @return the aggregated overview
     */
    @Operation(summary = "Get the system monitoring overview (ADMIN)")
    @GetMapping("/overview")
    public MonitoringOverviewResponse getOverview(
            @RequestParam(defaultValue = "ONE_DAY") MetricRange range) {
        return monitoringService.getOverview(range);
    }
}
