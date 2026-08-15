package com.clb.charity.notification.dto.request;

import com.clb.charity.common.model.NotificationType;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * Bulk update of the caller's per-type notification preferences.
 *
 * @param preferences the desired enabled/disabled state for each type being changed
 */
public record UpdateNotificationPreferencesRequest(@NotNull List<Entry> preferences) {

    /**
     * One type's desired enabled state.
     *
     * @param type the notification type
     * @param enabled true to receive this type, false to mute it
     */
    public record Entry(@NotNull NotificationType type, boolean enabled) {
    }
}
