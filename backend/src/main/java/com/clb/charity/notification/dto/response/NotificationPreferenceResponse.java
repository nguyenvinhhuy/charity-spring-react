package com.clb.charity.notification.dto.response;

import com.clb.charity.notification.domain.NotificationType;

/**
 * Whether the caller currently receives notifications of a given type.
 *
 * @param type the notification type
 * @param enabled false if the caller has muted this type
 */
public record NotificationPreferenceResponse(NotificationType type, boolean enabled) {
}
