package com.clb.charity.notification.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * An ADMIN-authored announcement to be fanned out to every active member.
 *
 * @param title short headline
 * @param message the announcement body
 */
public record CreateBroadcastRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 2000) String message) {
}
