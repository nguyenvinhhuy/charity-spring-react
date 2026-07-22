package com.clb.charity.campaign.controller;

import com.clb.charity.campaign.domain.CampaignCategory;
import com.clb.charity.campaign.domain.CampaignStatus;
import com.clb.charity.campaign.dto.request.CreateCampaignRequest;
import com.clb.charity.campaign.dto.request.CreateDonationRequest;
import com.clb.charity.campaign.dto.request.UpdateCampaignRequest;
import com.clb.charity.campaign.dto.request.UpdateProgressRequest;
import com.clb.charity.campaign.dto.request.UpdateStatusRequest;
import com.clb.charity.campaign.dto.response.CampaignDetailResponse;
import com.clb.charity.campaign.dto.response.CampaignSummaryResponse;
import com.clb.charity.campaign.dto.response.DonationResponse;
import com.clb.charity.campaign.service.CampaignService;
import com.clb.charity.common.security.AuthPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/campaigns")
@RequiredArgsConstructor
public class CampaignController {

    private final CampaignService campaignService;

    /**
     * Lists campaigns with optional status, category, and title search filters.
     *
     * @param status optional status filter
     * @param category optional category filter
     * @param search optional case-insensitive text matched against the campaign title
     * @param pageable the page request
     * @return a page of campaign summaries
     */
    @Operation(summary = "List campaigns (paginated, optional status/category/search filters)")
    @GetMapping
    public Page<CampaignSummaryResponse> list(
            @RequestParam(required = false) CampaignStatus status,
            @RequestParam(required = false) CampaignCategory category,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        return campaignService.list(status, category, search, pageable);
    }

    /**
     * Returns the campaign detail for the given slug.
     *
     * @param slug the campaign slug
     * @return the campaign detail
     */
    @Operation(summary = "Get campaign detail by slug")
    @GetMapping("/{slug}")
    public CampaignDetailResponse getBySlug(@PathVariable String slug) {
        return campaignService.getBySlug(slug);
    }

    /**
     * Returns the campaign's VietQR image as PNG.
     *
     * @param slug the campaign slug
     * @param amount optional pre-filled amount
     * @return the PNG image response
     */
    @Operation(summary = "Get the campaign's VietQR image (PNG)")
    @GetMapping(value = "/{slug}/qr", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> qr(@PathVariable String slug,
                                     @RequestParam(required = false) Long amount) {
        byte[] png = campaignService.generateQr(slug, amount);
        return ResponseEntity.ok().contentType(MediaType.IMAGE_PNG).body(png);
    }

    /**
     * Creates a campaign owned by the authenticated member.
     *
     * @param request the campaign fields
     * @param principal the authenticated principal
     * @return the created campaign detail with 201 status
     */
    @Operation(summary = "Create a campaign (starts in DRAFT)")
    @PostMapping
    public ResponseEntity<CampaignDetailResponse> create(
            @Valid @RequestBody CreateCampaignRequest request,
            @AuthenticationPrincipal AuthPrincipal principal) {
        CampaignDetailResponse created = campaignService.create(request, principal.memberId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Updates an existing campaign's editable fields.
     *
     * @param id the campaign id
     * @param request the new field values
     * @return the updated campaign detail
     */
    @Operation(summary = "Update a campaign")
    @PutMapping("/{id}")
    public CampaignDetailResponse update(@PathVariable Long id, @Valid @RequestBody UpdateCampaignRequest request) {
        return campaignService.update(id, request);
    }

    /**
     * Changes a campaign's status.
     *
     * @param id the campaign id
     * @param request the desired status
     * @return the updated campaign detail
     */
    @Operation(summary = "Change campaign status (ADMIN)")
    @PatchMapping("/{id}/status")
    public CampaignDetailResponse changeStatus(@PathVariable Long id, @Valid @RequestBody UpdateStatusRequest request) {
        return campaignService.changeStatus(id, request.status());
    }

    /**
     * Updates a campaign's amount raised and donor count.
     *
     * @param id the campaign id
     * @param request the progress values
     * @return the updated campaign detail
     */
    @Operation(summary = "Update campaign progress: amount raised and donor count (ADMIN)")
    @PatchMapping("/{id}/progress")
    public CampaignDetailResponse updateProgress(@PathVariable Long id, @Valid @RequestBody UpdateProgressRequest request) {
        return campaignService.updateProgress(id, request.currentAmount(), request.donorCount());
    }

    /**
     * Deletes a DRAFT campaign.
     *
     * @param id the campaign id
     * @return an empty 204 response
     */
    @Operation(summary = "Delete a DRAFT campaign (ADMIN)")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        campaignService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Lists a campaign's donation ledger entries.
     *
     * @param id the campaign id
     * @param pageable the page request
     * @return a page of donations
     */
    @Operation(summary = "List a campaign's donations")
    @GetMapping("/{id}/donations")
    public Page<DonationResponse> listDonations(@PathVariable Long id, Pageable pageable) {
        return campaignService.listDonations(id, pageable);
    }

    /**
     * Records a donation for a campaign, updating its raised amount and donor count.
     *
     * @param id the campaign id
     * @param request the donation fields
     * @param principal the authenticated principal
     * @return the created donation with 201 status
     */
    @Operation(summary = "Record a donation for a campaign (ADMIN)")
    @PostMapping("/{id}/donations")
    public ResponseEntity<DonationResponse> addDonation(
            @PathVariable Long id,
            @Valid @RequestBody CreateDonationRequest request,
            @AuthenticationPrincipal AuthPrincipal principal) {
        DonationResponse created = campaignService.addDonation(id, request, principal.memberId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Deletes a donation, reversing its contribution to the campaign's totals.
     *
     * @param id the campaign id
     * @param donationId the donation id
     * @return an empty 204 response
     */
    @Operation(summary = "Delete a donation (ADMIN)")
    @DeleteMapping("/{id}/donations/{donationId}")
    public ResponseEntity<Void> deleteDonation(@PathVariable Long id, @PathVariable Long donationId) {
        campaignService.deleteDonation(id, donationId);
        return ResponseEntity.noContent().build();
    }
}
