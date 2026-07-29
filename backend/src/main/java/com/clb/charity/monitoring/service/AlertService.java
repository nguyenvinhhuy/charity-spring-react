package com.clb.charity.monitoring.service;

public interface AlertService {

    /**
     * Sends an alert email via Resend, silently doing nothing if no Resend API key is configured.
     *
     * @param subject the email subject
     * @param htmlBody the email body, as HTML
     */
    void sendAlertEmail(String subject, String htmlBody);
}
