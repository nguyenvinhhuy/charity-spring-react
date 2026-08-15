package com.clb.charity.notification.service;

import com.clb.charity.common.model.NotificationReferenceType;
import com.clb.charity.common.model.NotificationType;
import com.clb.charity.notification.dto.request.CreateBroadcastRequest;
import com.clb.charity.notification.dto.request.UpdateNotificationPreferencesRequest;
import com.clb.charity.notification.dto.response.NotificationPreferenceResponse;
import com.clb.charity.notification.dto.response.NotificationResponse;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

public interface NotificationService {

    /**
     * Lists a member's notifications, most recent first.
     *
     * @param recipientMemberId the recipient's member id
     * @param pageable pagination
     * @return the requested page of notifications
     */
    Page<NotificationResponse> list(Long recipientMemberId, Pageable pageable);

    /**
     * Counts a member's unread notifications.
     *
     * @param recipientMemberId the recipient's member id
     * @return the unread count
     */
    long countUnread(Long recipientMemberId);

    /**
     * Marks a single notification as read.
     *
     * @param id notification id
     * @param recipientMemberId the caller's member id, to enforce ownership
     * @return the updated notification
     */
    NotificationResponse markRead(Long id, Long recipientMemberId);

    /**
     * Marks every one of a member's unread notifications as read.
     *
     * @param recipientMemberId the caller's member id
     */
    void markAllRead(Long recipientMemberId);

    /**
     * Deletes a single notification.
     *
     * @param id notification id
     * @param recipientMemberId the caller's member id, to enforce ownership
     */
    void delete(Long id, Long recipientMemberId);

    /**
     * Lists the caller's enabled/disabled state for every notification type.
     *
     * @param memberId the caller's member id
     * @return one entry per {@link NotificationType}
     */
    List<NotificationPreferenceResponse> getPreferences(Long memberId);

    /**
     * Bulk-updates the caller's per-type notification preferences.
     *
     * @param memberId the caller's member id
     * @param request the desired enabled/disabled state per type
     */
    void updatePreferences(Long memberId, UpdateNotificationPreferencesRequest request);

    /**
     * Creates a notification for one recipient and pushes it over their live SSE connections, unless
     * the recipient has muted this type.
     *
     * @param recipientMemberId who the notification is for
     * @param type the event this notification was generated from
     * @param actorName free-text name of whoever triggered the event, if any
     * @param referenceType what {@code referenceId} points to, if any
     * @param referenceId id of the related campaign/post/inquiry, if any
     * @param referenceTitle title of the related resource, if known
     * @param detail small per-type extra parameter (e.g. the new status name), if any
     */
    void notify(Long recipientMemberId, NotificationType type, @Nullable String actorName,
                @Nullable NotificationReferenceType referenceType, @Nullable Long referenceId,
                @Nullable String referenceTitle, @Nullable String detail);

    /**
     * Fans an ADMIN-authored announcement out to every active member.
     *
     * @param request the announcement title/message
     */
    void broadcast(CreateBroadcastRequest request);

    /**
     * Opens a long-lived SSE connection that receives this member's new notifications as they occur.
     *
     * @param memberId the caller's member id
     * @return the emitter the caller subscribes to
     */
    SseEmitter subscribe(Long memberId);
}
