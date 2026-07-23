package com.clb.charity.registration.dto.response;

import org.jspecify.annotations.Nullable;

import java.time.Instant;

/**
 * A campaign's registration state as seen by the current viewer.
 *
 * @param registeredCount total number of active registrations
 * @param isRegistered whether the viewer is currently registered
 * @param myRegisteredAt when the viewer registered, or null if not registered
 * @param canCancel whether the viewer may still cancel (before the 1-day-before-event cutoff)
 */
public record RegistrationSummaryResponse(
        int registeredCount,
        boolean isRegistered,
        @Nullable Instant myRegisteredAt,
        boolean canCancel) {
}
