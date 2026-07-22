package com.clb.charity.report.service.impl;

import com.clb.charity.campaign.domain.Campaign;
import com.clb.charity.campaign.repository.CampaignRepository;
import com.clb.charity.common.exception.CampaignNotFoundException;
import com.clb.charity.report.service.ReportService;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Generates PDF and CSV donation reports.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private static final String CSV_HEADER =
            "id,title,status,category,targetAmount,currentAmount,donorCount,startDate,endDate";
    // UTF-8 byte-order mark (U+FEFF) so Excel opens the CSV as UTF-8.
    private static final String UTF8_BOM =
            new String(new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF}, StandardCharsets.UTF_8);
    private static final int PERCENT_SCALE = 100;

    private final CampaignRepository campaignRepository;

    @Override
    public byte[] generateCampaignPdf(Long campaignId) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new CampaignNotFoundException(String.valueOf(campaignId)));

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        // Closing the Document cascades to the PdfDocument and PdfWriter, so only
        // the Document is managed here to avoid closing the same resource twice.
        PdfDocument pdf = new PdfDocument(new PdfWriter(out));
        try (Document doc = new Document(pdf)) {

            doc.add(new Paragraph("Donation Report")
                    .setBold()
                    .setFontSize(20)
                    .setTextAlignment(TextAlignment.CENTER));
            // FUTURE: embed a Unicode TTF font so Vietnamese diacritics render (default PDF font is Latin-only).
            doc.add(new Paragraph(campaign.getTitle()).setFontSize(14).setItalic());

            Table table = new Table(UnitValue.createPercentArray(new float[]{40, 60}))
                    .useAllAvailableWidth();
            addRow(table, "Slug", campaign.getSlug());
            addRow(table, "Status", campaign.getStatus().name());
            addRow(table, "Category", campaign.getCategory().name());
            addRow(table, "Target amount (VND)", String.valueOf(campaign.getTargetAmount()));
            addRow(table, "Raised amount (VND)", String.valueOf(campaign.getCurrentAmount()));
            addRow(table, "Progress", progressPercent(campaign) + " %");
            addRow(table, "Donor count", String.valueOf(campaign.getDonorCount()));
            addRow(table, "Start date", String.valueOf(campaign.getStartDate()));
            addRow(table, "End date", campaign.getEndDate() != null ? campaign.getEndDate().toString() : "-");
            doc.add(table);
        }
        // Document is now closed and fully flushed to the stream.
        return out.toByteArray();
    }

    @Override
    public byte[] exportCampaignsCsv() {
        List<Campaign> campaigns = campaignRepository.findAll();
        StringBuilder sb = new StringBuilder();
        sb.append(UTF8_BOM); // so Excel renders Vietnamese correctly
        sb.append(CSV_HEADER).append("\r\n");
        for (Campaign c : campaigns) {
            sb.append(c.getId()).append(',')
                    .append(csv(c.getTitle())).append(',')
                    .append(c.getStatus().name()).append(',')
                    .append(c.getCategory().name()).append(',')
                    .append(c.getTargetAmount()).append(',')
                    .append(c.getCurrentAmount()).append(',')
                    .append(c.getDonorCount()).append(',')
                    .append(c.getStartDate()).append(',')
                    .append(c.getEndDate() != null ? c.getEndDate().toString() : "")
                    .append("\r\n");
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Computes the funding progress as an integer percentage.
     *
     * @param campaign the campaign to measure
     * @return the progress percentage, or 0 when the target is non-positive
     */
    private long progressPercent(Campaign campaign) {
        if (campaign.getTargetAmount() <= 0) {
            return 0;
        }
        return campaign.getCurrentAmount() * PERCENT_SCALE / campaign.getTargetAmount();
    }

    /**
     * Adds a label/value row to the given PDF table.
     *
     * @param table the target table
     * @param label the row label
     * @param value the row value
     */
    private void addRow(Table table, String label, String value) {
        table.addCell(new Cell().add(new Paragraph(label).setBold()));
        table.addCell(new Cell().add(new Paragraph(value)));
    }

    /**
     * Quotes a CSV field and escapes embedded quotes.
     *
     * @param value the raw field value, may be null
     * @return the quoted, escaped CSV field
     */
    private String csv(String value) {
        String safe = value != null ? value : "";
        return '"' + safe.replace("\"", "\"\"") + '"';
    }
}
