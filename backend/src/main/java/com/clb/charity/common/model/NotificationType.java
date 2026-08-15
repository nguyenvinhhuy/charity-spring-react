package com.clb.charity.common.model;

/** The kind of event a notification was generated from. */
public enum NotificationType {
    COMMENT_MENTION,
    CAMPAIGN_STATUS_CHANGED,
    REGISTRATION_CREATED,
    REGISTRATION_CANCELLED,
    REGISTRATION_REMOVED,
    DONATION_RECEIVED,
    INQUIRY_RECEIVED,
    BROADCAST
}
