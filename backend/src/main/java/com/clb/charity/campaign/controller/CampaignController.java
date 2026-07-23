package com.clb.charity.campaign.controller;

import com.clb.charity.campaign.domain.CampaignCategory;
import com.clb.charity.campaign.domain.CampaignStatus;
import com.clb.charity.campaign.dto.request.CreateCampaignRequest;
import com.clb.charity.campaign.dto.request.CreateDonationRequest;
import com.clb.charity.campaign.dto.request.UpdateCampaignRequest;
import com.clb.charity.campaign.dto.request.UpdateProgressRequest;
import com.clb.charity.campaign.dto.request.UpdateStatusRequest;
import com.clb.charity.campaign.dto.response.CampaignDetailResponse;
import com.clb.charity.campaign.dto.response.CampaignRegistrationContext;
import com.clb.charity.campaign.dto.response.CampaignSummaryResponse;
import com.clb.charity.campaign.dto.response.DonationResponse;
import com.clb.charity.campaign.dto.response.PublicCampaignStatsResponse;
import com.clb.charity.campaign.service.CampaignService;
import com.clb.charity.comment.domain.CommentTargetType;
import com.clb.charity.comment.dto.request.CreateCommentRequest;
import com.clb.charity.comment.dto.request.UpdateCommentRequest;
import com.clb.charity.comment.dto.response.CommentResponse;
import com.clb.charity.comment.service.CommentService;
import com.clb.charity.common.exception.RegistrationRequestException;
import com.clb.charity.common.security.AuthPrincipal;
import com.clb.charity.reaction.domain.ReactionTargetType;
import com.clb.charity.reaction.dto.request.SetReactionRequest;
import com.clb.charity.reaction.dto.response.ReactionSummaryResponse;
import com.clb.charity.reaction.service.ReactionService;
import com.clb.charity.registration.dto.response.RegistrantResponse;
import com.clb.charity.registration.dto.response.RegistrationSummaryResponse;
import com.clb.charity.registration.service.RegistrationService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
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
    private final ReactionService reactionService;
    private final CommentService commentService;
    private final RegistrationService registrationService;

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
     * Returns the campaign and donation totals safe to show on the public site.
     *
     * @return the public-safe aggregated totals
     */
    @Operation(summary = "Get public campaign/donation totals")
    @GetMapping("/stats")
    public PublicCampaignStatsResponse publicStats() {
        return campaignService.publicStats();
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

    /**
     * Records one view of a campaign (fire-and-forget; the frontend calls this once per detail page load).
     *
     * @param id the campaign id
     * @return an empty 204 response
     */
    @Operation(summary = "Record one view of a campaign")
    @PostMapping("/{id}/views")
    public ResponseEntity<Void> recordView(@PathVariable Long id) {
        campaignService.recordView(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Returns a campaign's reaction summary: per-type counts, reactor names, and the caller's own pick.
     *
     * @param id the campaign id
     * @param principal the authenticated principal, or null when anonymous
     * @return the reaction summary
     */
    @Operation(summary = "Get a campaign's reaction summary")
    @GetMapping("/{id}/reactions")
    public ReactionSummaryResponse getReactions(@PathVariable Long id,
                                                @AuthenticationPrincipal @Nullable AuthPrincipal principal) {
        return reactionService.getSummary(ReactionTargetType.CAMPAIGN, id, principal == null ? null : principal.memberId());
    }

    /**
     * Sets (creating or changing) the authenticated member's reaction on a campaign.
     *
     * @param id the campaign id
     * @param request the chosen reaction
     * @param principal the authenticated principal
     * @return an empty 204 response
     */
    @Operation(summary = "Set the caller's reaction on a campaign")
    @PutMapping("/{id}/reactions/me")
    public ResponseEntity<Void> setReaction(@PathVariable Long id, @Valid @RequestBody SetReactionRequest request,
                                            @AuthenticationPrincipal AuthPrincipal principal) {
        reactionService.setReaction(ReactionTargetType.CAMPAIGN, id, principal.memberId(), request.type());
        return ResponseEntity.noContent().build();
    }

    /**
     * Removes the authenticated member's reaction on a campaign, if any.
     *
     * @param id the campaign id
     * @param principal the authenticated principal
     * @return an empty 204 response
     */
    @Operation(summary = "Remove the caller's reaction on a campaign")
    @DeleteMapping("/{id}/reactions/me")
    public ResponseEntity<Void> removeReaction(@PathVariable Long id, @AuthenticationPrincipal AuthPrincipal principal) {
        reactionService.removeReaction(ReactionTargetType.CAMPAIGN, id, principal.memberId());
        return ResponseEntity.noContent().build();
    }

    /**
     * Lists a campaign's comments, most recent first, with viewer-relative edit/delete permissions.
     *
     * @param id the campaign id
     * @param pageable the page request
     * @param principal the authenticated principal, or null when anonymous
     * @return a page of comments
     */
    @Operation(summary = "List a campaign's comments")
    @GetMapping("/{id}/comments")
    public Page<CommentResponse> listComments(@PathVariable Long id, Pageable pageable,
                                              @AuthenticationPrincipal @Nullable AuthPrincipal principal) {
        return commentService.list(CommentTargetType.CAMPAIGN, id, pageable,
                principal == null ? null : principal.memberId(),
                principal == null ? null : principal.role());
    }

    /**
     * Adds a comment to a campaign on behalf of the authenticated member.
     *
     * @param id the campaign id
     * @param request the comment content
     * @param principal the authenticated principal
     * @return the created comment with 201 status
     */
    @Operation(summary = "Add a comment to a campaign")
    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponse> addComment(@PathVariable Long id, @Valid @RequestBody CreateCommentRequest request,
                                                      @AuthenticationPrincipal AuthPrincipal principal) {
        CommentResponse created = commentService.create(CommentTargetType.CAMPAIGN, id, principal.memberId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Updates a comment's content, allowed only for its author within the 15-minute edit window.
     *
     * @param id the campaign id
     * @param commentId the comment id
     * @param request the new content
     * @param principal the authenticated principal
     * @return the updated comment
     */
    @Operation(summary = "Update a campaign comment (author only, within the edit window)")
    @PutMapping("/{id}/comments/{commentId}")
    public CommentResponse updateComment(@PathVariable Long id, @PathVariable Long commentId,
                                         @Valid @RequestBody UpdateCommentRequest request,
                                         @AuthenticationPrincipal AuthPrincipal principal) {
        return commentService.update(commentId, principal.memberId(), request);
    }

    /**
     * Deletes a comment, allowed for its author or an ADMIN/CONTRIBUTOR moderating it.
     *
     * @param id the campaign id
     * @param commentId the comment id
     * @param principal the authenticated principal
     * @return an empty 204 response
     */
    @Operation(summary = "Delete a campaign comment (author or moderator)")
    @DeleteMapping("/{id}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id, @PathVariable Long commentId,
                                              @AuthenticationPrincipal AuthPrincipal principal) {
        commentService.delete(commentId, principal.memberId(), principal.role());
        return ResponseEntity.noContent().build();
    }

    /**
     * Gets a campaign's registration summary as seen by the caller.
     *
     * @param id the campaign id
     * @param principal the authenticated principal, or null when anonymous
     * @return the registration summary
     */
    @Operation(summary = "Get a campaign's registration summary")
    @GetMapping("/{id}/registrations/summary")
    public RegistrationSummaryResponse getRegistrationSummary(@PathVariable Long id,
                                                              @AuthenticationPrincipal @Nullable AuthPrincipal principal) {
        CampaignRegistrationContext ctx = requireRegistrationOpen(id);
        return registrationService.getSummary(id, ctx.eventStartDate(), principal == null ? null : principal.memberId());
    }

    /**
     * Registers the authenticated member for a campaign's event, enforcing its capacity limit.
     *
     * @param id the campaign id
     * @param principal the authenticated principal
     * @return the updated registration summary with 201 status
     */
    @Operation(summary = "Register the caller for a campaign's event")
    @PostMapping("/{id}/registrations/me")
    public ResponseEntity<RegistrationSummaryResponse> register(@PathVariable Long id,
                                                                 @AuthenticationPrincipal AuthPrincipal principal) {
        CampaignRegistrationContext ctx = requireRegistrationOpen(id);
        RegistrationSummaryResponse summary =
                registrationService.register(id, ctx.capacity(), ctx.eventStartDate(), principal.memberId());
        return ResponseEntity.status(HttpStatus.CREATED).body(summary);
    }

    /**
     * Cancels the authenticated member's own registration, allowed only before the cancel cutoff.
     *
     * @param id the campaign id
     * @param principal the authenticated principal
     * @return an empty 204 response
     */
    @Operation(summary = "Cancel the caller's own registration")
    @DeleteMapping("/{id}/registrations/me")
    public ResponseEntity<Void> cancelRegistration(@PathVariable Long id, @AuthenticationPrincipal AuthPrincipal principal) {
        CampaignRegistrationContext ctx = requireRegistrationOpen(id);
        registrationService.cancel(id, ctx.eventStartDate(), principal.memberId());
        return ResponseEntity.noContent().build();
    }

    /**
     * Lists a campaign's registrants, earliest first (admin/contributor roster view).
     *
     * @param id the campaign id
     * @param pageable the page request
     * @return a page of registrants
     */
    @Operation(summary = "List a campaign's registrants")
    @GetMapping("/{id}/registrations")
    public Page<RegistrantResponse> listRegistrants(@PathVariable Long id, Pageable pageable) {
        return registrationService.list(id, pageable);
    }

    /**
     * Force-removes a member's registration (ADMIN/CONTRIBUTOR moderation, no cutoff check).
     *
     * @param id the campaign id
     * @param memberId the registrant's member id to remove
     * @return an empty 204 response
     */
    @Operation(summary = "Force-remove a registrant (moderator)")
    @DeleteMapping("/{id}/registrations/{memberId}")
    public ResponseEntity<Void> removeRegistrant(@PathVariable Long id, @PathVariable Long memberId) {
        registrationService.adminRemove(id, memberId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Loads a campaign's registration context, rejecting the call if it does not accept registrations.
     *
     * @param id the campaign id
     * @return the registration context
     */
    private CampaignRegistrationContext requireRegistrationOpen(Long id) {
        CampaignRegistrationContext ctx = campaignService.getRegistrationContext(id);
        if (ctx.capacity() == null || ctx.eventStartDate() == null) {
            throw new RegistrationRequestException("This campaign does not accept event registrations");
        }
        return ctx;
    }
}
