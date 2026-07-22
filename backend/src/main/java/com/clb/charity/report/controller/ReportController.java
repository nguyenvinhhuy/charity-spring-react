package com.clb.charity.report.controller;

import com.clb.charity.report.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private static final MediaType CSV = MediaType.parseMediaType("text/csv");

    private final ReportService reportService;

    /**
     * Downloads a single-campaign donation report as PDF.
     *
     * @param id the campaign id
     * @return the PDF response with an attachment disposition
     */
    @Operation(summary = "Download a campaign donation report as PDF")
    @GetMapping("/campaigns/{id}/pdf")
    public ResponseEntity<byte[]> campaignPdf(@PathVariable Long id) {
        byte[] pdf = reportService.generateCampaignPdf(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("campaign-" + id + ".pdf").build().toString())
                .body(pdf);
    }

    /**
     * Exports all campaigns as CSV.
     *
     * @return the CSV response with an attachment disposition
     */
    @Operation(summary = "Export all campaigns as CSV")
    @GetMapping("/campaigns/export")
    public ResponseEntity<byte[]> campaignsCsv() {
        byte[] csv = reportService.exportCampaignsCsv();
        return ResponseEntity.ok()
                .contentType(CSV)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("campaigns.csv").build().toString())
                .body(csv);
    }
}
