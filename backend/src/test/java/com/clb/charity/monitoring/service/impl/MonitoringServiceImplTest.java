package com.clb.charity.monitoring.service.impl;

import com.clb.charity.common.config.AppProperties;
import com.clb.charity.monitoring.domain.MetricRange;
import com.clb.charity.monitoring.domain.MonitoringResource;
import com.clb.charity.monitoring.domain.RenderState;
import com.clb.charity.monitoring.dto.response.MetricPoint;
import com.clb.charity.monitoring.dto.response.MonitoringOverviewResponse;
import com.clb.charity.monitoring.service.AlertService;
import com.cloudinary.Cloudinary;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MonitoringServiceImplTest {

    @Mock
    private RestClient restClient;

    @Mock
    private Cloudinary cloudinary;

    @Mock
    private EntityManager entityManager;

    @Mock
    private AppProperties appProperties;

    @Mock
    private AlertService alertService;

    @Mock
    private ObjectMapper objectMapper;

    private MonitoringServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new MonitoringServiceImpl(restClient, cloudinary, entityManager, appProperties, alertService, objectMapper);
    }

    @Test
    void getOverview_reportsNotConfigured_whenNoExternalCredentialsSet() {
        when(appProperties.render()).thenReturn(new AppProperties.Render("", ""));
        when(appProperties.cloudinary()).thenReturn(new AppProperties.Cloudinary("", "", "", "clb-media"));
        when(appProperties.alert()).thenReturn(
                new AppProperties.Alert("", "nguyenvana0258@gmail.com", "onboarding@resend.dev", 0.8, 500_000_000L, 25_000_000_000L));

        Query query = mock(Query.class);
        when(entityManager.createNativeQuery(anyString())).thenReturn(query);
        when(query.getSingleResult()).thenReturn(0L);
        when(query.setParameter(anyString(), any())).thenReturn(query);
        when(query.getResultList()).thenReturn(List.of());

        MonitoringOverviewResponse overview = service.getOverview(MetricRange.ONE_DAY);

        assertFalse(overview.render().configured());
        assertEquals(RenderState.NOT_CONFIGURED, overview.render().status());
        assertFalse(overview.cloudinary().configured());
    }

    @Test
    void evaluate_sendsAlertOnlyOnTransitionToAlerting_andRecoveryOnlyOnceStateClears() {
        service.evaluate(MonitoringResource.DATABASE, true, "over 80%");
        // Staying in the same ALERT state must not trigger a second email.
        service.evaluate(MonitoringResource.DATABASE, true, "over 80%");
        // Clearing the alert must trigger exactly one "recovered" email.
        service.evaluate(MonitoringResource.DATABASE, false, "over 80%");
        service.evaluate(MonitoringResource.DATABASE, false, "over 80%");

        verify(alertService, times(1)).sendAlertEmail(contains("Cảnh báo"), anyString());
        verify(alertService, times(1)).sendAlertEmail(contains("phục hồi"), anyString());
    }

    @Test
    void renderAlertMessage_namesMemoryOnly_whenOnlyMemoryCrossedThreshold() {
        MetricPoint memoryPeak = new MetricPoint(Instant.parse("2026-07-30T02:33:00Z"), 81.4);

        String message = service.renderAlertMessage(false, null, memoryPeak);

        assertTrue(message.contains("RAM đạt 81.4%"), message);
        assertFalse(message.contains("CPU"), message);
    }

    @Test
    void renderAlertMessage_namesBothMetrics_whenBothCrossedThreshold() {
        MetricPoint cpuPeak = new MetricPoint(Instant.parse("2026-07-30T02:30:00Z"), 92.0);
        MetricPoint memoryPeak = new MetricPoint(Instant.parse("2026-07-30T02:33:00Z"), 81.4);

        String message = service.renderAlertMessage(false, cpuPeak, memoryPeak);

        assertTrue(message.contains("CPU đạt 92.0%"), message);
        assertTrue(message.contains("RAM đạt 81.4%"), message);
    }

    @Test
    void renderAlertMessage_reportsDeployFailure_ignoringMetrics_whenDeployFailed() {
        MetricPoint memoryPeak = new MetricPoint(Instant.parse("2026-07-30T02:33:00Z"), 81.4);

        String message = service.renderAlertMessage(true, null, memoryPeak);

        assertTrue(message.contains("lần deploy gần nhất bị lỗi"), message);
        assertFalse(message.contains("RAM"), message);
    }
}
