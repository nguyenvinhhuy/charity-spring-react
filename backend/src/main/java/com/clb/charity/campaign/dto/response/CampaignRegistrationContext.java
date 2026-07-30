package com.clb.charity.campaign.dto.response;

import org.jspecify.annotations.Nullable;

import java.time.LocalDate;

/**
 * The subset of a campaign's fields needed by the registration feature to check availability and cancellation
 * eligibility, and by the controller to notify the campaign's creator, without loading the full campaign detail.
 *
 * @param capacity the max participant count, or null if the campaign does not accept registrations
 * @param eventStartDate the on-ground event's start date, or null
 * @param createdBy the campaign creator's member id, or null
 * @param title the campaign's title
 */
public record CampaignRegistrationContext(
        @Nullable Integer capacity,
        @Nullable LocalDate eventStartDate,
        @Nullable Long createdBy,
        String title) {
}
