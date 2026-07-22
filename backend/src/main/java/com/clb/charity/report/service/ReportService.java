package com.clb.charity.report.service;

/**
 * Generates PDF and CSV donation reports.
 */
public interface ReportService {

    /**
     * Generates a single-campaign donation report as a PDF document.
     *
     * @param campaignId the campaign id
     * @return the PDF document bytes
     */
    byte[] generateCampaignPdf(Long campaignId);

    /**
     * Exports all campaigns as a UTF-8 CSV document.
     *
     * @return the CSV document bytes
     */
    byte[] exportCampaignsCsv();
}
