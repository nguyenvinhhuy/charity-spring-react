package com.clb.charity.registration.dto.response;

import java.time.Instant;

/**
 * One entry in a campaign's registrant roster, as seen by an admin/contributor.
 *
 * @param memberId the registrant's member id
 * @param memberName the registrant's display name
 * @param registeredAt when they registered
 */
public record RegistrantResponse(Long memberId, String memberName, Instant registeredAt) {
}
