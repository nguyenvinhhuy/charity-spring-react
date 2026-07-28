package com.clb.charity.notification.dto.response;

/**
 * The caller's current unread notification count.
 *
 * @param count number of unread notifications
 */
public record UnreadCountResponse(long count) {
}
