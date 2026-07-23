package com.clb.charity.campaign.service;

import com.clb.charity.campaign.domain.CampaignCategory;
import com.clb.charity.campaign.domain.CampaignStatus;
import com.clb.charity.campaign.dto.request.CreateCampaignRequest;
import com.clb.charity.campaign.dto.request.CreateDonationRequest;
import com.clb.charity.campaign.dto.request.UpdateCampaignRequest;
import com.clb.charity.campaign.dto.response.CampaignDetailResponse;
import com.clb.charity.campaign.dto.response.CampaignRegistrationContext;
import com.clb.charity.campaign.dto.response.CampaignStatsResponse;
import com.clb.charity.campaign.dto.response.CampaignSummaryResponse;
import com.clb.charity.campaign.dto.response.DonationResponse;
import com.clb.charity.campaign.dto.response.PublicCampaignStatsResponse;
import com.clb.charity.common.model.Granularity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.jspecify.annotations.Nullable;

/**
 * Campaign lifecycle and query operations.
 */
public interface CampaignService {

    /**
     * Lists campaigns filtered by optional status, category, and title search text.
     *
     * @param status optional status filter, or null for any
     * @param category optional category filter, or null for any
     * @param search optional case-insensitive text matched against title/titleEn, or null for any
     * @param pageable the page request
     * @return a page of campaign summaries
     */
    Page<CampaignSummaryResponse> list(@Nullable CampaignStatus status, @Nullable CampaignCategory category,
                                       @Nullable String search, Pageable pageable);

    /**
     * Gets the detail of the campaign identified by its slug.
     *
     * @param slug the campaign slug
     * @return the campaign detail
     */
    CampaignDetailResponse getBySlug(String slug);

    /**
     * Creates a campaign in DRAFT status from the given request.
     *
     * @param request the campaign fields
     * @param createdBy id of the authoring member
     * @return the created campaign detail
     */
    CampaignDetailResponse create(CreateCampaignRequest request, Long createdBy);

    /**
     * Updates the editable fields of an existing campaign.
     *
     * @param id the campaign id
     * @param request the new field values
     * @return the updated campaign detail
     */
    CampaignDetailResponse update(Long id, UpdateCampaignRequest request);

    /**
     * Transitions a campaign to the target status when the transition is allowed.
     *
     * @param id the campaign id
     * @param target the desired status
     * @return the updated campaign detail
     */
    CampaignDetailResponse changeStatus(Long id, CampaignStatus target);

    /**
     * Sets the amount raised and donor count for a campaign.
     *
     * @param id the campaign id
     * @param currentAmount the amount raised so far
     * @param donorCount the number of donors
     * @return the updated campaign detail
     */
    CampaignDetailResponse updateProgress(Long id, long currentAmount, int donorCount);

    /**
     * Deletes a campaign, allowed only while it is in DRAFT status.
     *
     * @param id the campaign id
     */
    void delete(Long id);

    /**
     * Proxies the campaign's VietQR image as PNG bytes.
     *
     * @param slug the campaign slug
     * @param amount optional pre-filled amount, or null
     * @return the QR image as PNG bytes
     */
    byte[] generateQr(String slug, @Nullable Long amount);

    /**
     * Records a donation for a campaign and increases its cached raised amount and donor count.
     *
     * @param campaignId the campaign id
     * @param request the donation fields
     * @param createdBy id of the member recording the donation, or null
     * @return the created donation
     */
    DonationResponse addDonation(Long campaignId, CreateDonationRequest request, @Nullable Long createdBy);

    /**
     * Deletes a donation and reverses its contribution to the campaign's cached totals.
     *
     * @param campaignId the campaign id
     * @param donationId the donation id
     */
    void deleteDonation(Long campaignId, Long donationId);

    /**
     * Lists a campaign's donations, most recent first.
     *
     * @param campaignId the campaign id
     * @param pageable the page request
     * @return a page of donations
     */
    Page<DonationResponse> listDonations(Long campaignId, Pageable pageable);

    /**
     * Builds aggregated campaign and donation statistics for the dashboard.
     *
     * @param granularity the time bucket for the donation series
     * @return the aggregated statistics
     */
    CampaignStatsResponse stats(Granularity granularity);

    /**
     * Builds the campaign and donation totals safe to expose on the public site.
     *
     * @return the public-safe aggregated totals
     */
    PublicCampaignStatsResponse publicStats();

    /**
     * Records one view of a campaign, incrementing its cached view count.
     *
     * @param id the campaign id
     */
    void recordView(Long id);

    /**
     * Returns a campaign's capacity and event start date, used by the registration feature to
     * check availability and cancellation eligibility without loading the full campaign detail.
     *
     * @param id the campaign id
     * @return the registration context
     */
    CampaignRegistrationContext getRegistrationContext(Long id);
}
