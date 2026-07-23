package com.clb.charity.registration.service;

import com.clb.charity.registration.dto.response.RegistrantResponse;
import com.clb.charity.registration.dto.response.RegistrationSummaryResponse;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

/**
 * Campaign participant registration operations.
 */
public interface RegistrationService {

    /**
     * Returns a campaign's registration summary as seen by the given viewer.
     *
     * @param campaignId the campaign id
     * @param eventStartDate the campaign's event start date, used for the cancel cutoff
     * @param viewerMemberId the viewing member's id, or null when anonymous
     * @return the registration summary
     */
    RegistrationSummaryResponse getSummary(Long campaignId, LocalDate eventStartDate, @Nullable Long viewerMemberId);

    /**
     * Registers a member for a campaign, enforcing the capacity limit and rejecting duplicates.
     *
     * @param campaignId the campaign id
     * @param capacity the campaign's max participant count
     * @param eventStartDate the campaign's event start date, used for the cancel cutoff
     * @param memberId the registering member's id
     * @return the updated registration summary
     */
    RegistrationSummaryResponse register(Long campaignId, int capacity, LocalDate eventStartDate, Long memberId);

    /**
     * Cancels a member's own registration, allowed only before the 1-day-before-event cutoff.
     *
     * @param campaignId the campaign id
     * @param eventStartDate the campaign's event start date, used for the cancel cutoff
     * @param memberId the calling member's id
     */
    void cancel(Long campaignId, LocalDate eventStartDate, Long memberId);

    /**
     * Lists a campaign's registrants, earliest first, for the admin/contributor roster view.
     *
     * @param campaignId the campaign id
     * @param pageable the page request
     * @return a page of registrants
     */
    Page<RegistrantResponse> list(Long campaignId, Pageable pageable);

    /**
     * Force-removes a member's registration, allowed for an ADMIN/CONTRIBUTOR moderating it, with
     * no cancel-cutoff check.
     *
     * @param campaignId the campaign id
     * @param targetMemberId the registrant's member id to remove
     */
    void adminRemove(Long campaignId, Long targetMemberId);

    /**
     * Deletes every registration recorded against a campaign, used when the campaign itself is deleted.
     *
     * @param campaignId the campaign id
     */
    void deleteAllForCampaign(Long campaignId);
}
