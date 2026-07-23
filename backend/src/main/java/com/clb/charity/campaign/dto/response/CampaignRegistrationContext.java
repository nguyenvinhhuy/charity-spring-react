package com.clb.charity.campaign.dto.response;

import org.jspecify.annotations.Nullable;

import java.time.LocalDate;

/**
 * The subset of a campaign's fields needed by the registration feature to check availability
 * and cancellation eligibility, without loading the full campaign detail.
 *
 * @param capacity the max participant count, or null if the campaign does not accept registrations
 * @param eventStartDate the on-ground event's start date, or null
 */
public record CampaignRegistrationContext(@Nullable Integer capacity, @Nullable LocalDate eventStartDate) {
}
