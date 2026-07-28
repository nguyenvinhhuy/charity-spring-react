package com.clb.charity.notification.dto.response;

import com.clb.charity.notification.domain.NotificationReferenceType;
import com.clb.charity.notification.domain.NotificationType;
import org.jspecify.annotations.Nullable;

import java.time.Instant;

/**
 * A single notification as seen by its recipient. For most types the frontend renders the
 * message itself from {@code type}/{@code actorName}/{@code referenceTitle}; {@code title}/
 * {@code message} are only populated for {@link NotificationType#BROADCAST}.
 *
 * @param id notification id
 * @param type the event this notification was generated from
 * @param actorName free-text name of whoever triggered the event, if any
 * @param referenceType what {@code referenceId} points to, if any
 * @param referenceId id of the related campaign/post/inquiry, if any
 * @param referenceTitle title of the related resource, if known
 * @param detail small per-type extra parameter (e.g. the new status name), if any
 * @param title admin-authored title, only set for {@code BROADCAST}
 * @param message admin-authored message, only set for {@code BROADCAST}
 * @param read whether the recipient has read this notification
 * @param createdAt when the notification was created
 */
public record NotificationResponse(
        Long id,
        NotificationType type,
        @Nullable String actorName,
        @Nullable NotificationReferenceType referenceType,
        @Nullable Long referenceId,
        @Nullable String referenceTitle,
        @Nullable String detail,
        @Nullable String title,
        @Nullable String message,
        boolean read,
        Instant createdAt) {
}
