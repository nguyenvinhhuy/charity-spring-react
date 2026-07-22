package com.clb.charity.campaign.domain;

import java.util.Set;

/**
 * Campaign statuses and their allowed lifecycle transitions.
 */
public enum CampaignStatus {
    DRAFT,
    ACTIVE,
    COMPLETED,
    CLOSED,
    ARCHIVED;

    // Lifecycle: DRAFT → ACTIVE → COMPLETED, and ACTIVE → CLOSED → ARCHIVED.
    private static final java.util.Map<CampaignStatus, Set<CampaignStatus>> ALLOWED = java.util.Map.of(
            DRAFT, Set.of(ACTIVE),
            ACTIVE, Set.of(COMPLETED, CLOSED),
            COMPLETED, Set.of(),
            CLOSED, Set.of(ARCHIVED),
            ARCHIVED, Set.of());

    public boolean canTransitionTo(CampaignStatus target) {
        return ALLOWED.getOrDefault(this, Set.of()).contains(target);
    }
}
