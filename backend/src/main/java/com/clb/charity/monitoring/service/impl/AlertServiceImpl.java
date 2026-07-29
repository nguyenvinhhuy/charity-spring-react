package com.clb.charity.monitoring.service.impl;

import com.clb.charity.common.config.AppProperties;
import com.clb.charity.monitoring.service.AlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;

/**
 * Sends alert emails through Resend's REST API.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AlertServiceImpl implements AlertService {

    private static final String RESEND_URL = "https://api.resend.com/emails";

    // Reuses the shared RestClient bean instead of adding a Spring Mail/SMTP dependency for one call site.
    private final RestClient restClient;
    private final AppProperties appProperties;

    @Override
    public void sendAlertEmail(String subject, String htmlBody) {
        AppProperties.Alert alert = appProperties.alert();
        if (alert.resendApiKey() == null || alert.resendApiKey().isBlank()) {
            log.info("RESEND_API_KEY not configured — skipping alert email: {}", subject);
            return;
        }
        try {
            restClient.post()
                    .uri(RESEND_URL)
                    .headers(h -> h.setBearerAuth(alert.resendApiKey()))
                    .body(new ResendEmailRequest(alert.emailFrom(), List.of(alert.emailTo()), subject, htmlBody))
                    .retrieve()
                    .toBodilessEntity();
            log.info("Sent alert email: {}", subject);
        } catch (RestClientException ex) {
            log.warn("Failed to send alert email via Resend: {}", ex.getMessage());
        }
    }

    private record ResendEmailRequest(String from, List<String> to, String subject, String html) {
    }
}
