import { api } from '@/api/axios';
import type { Page } from "@/types/common"
import type { AppNotification, CreateBroadcastRequest, NotificationPreference } from "@/types/notification"

export interface ListNotificationsParams {
  page?: number;
  size?: number;
}

/** Lists the caller's notifications, most recent first. */
export async function listNotifications(
  params: ListNotificationsParams = {},
): Promise<Page<AppNotification>> {
  const { data } = await api.get<Page<AppNotification>>('/notifications', { params });
  return data;
}

/** Fetches the caller's unread notification count. */
export async function getUnreadCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>('/notifications/unread-count');
  return data.count;
}

/** Marks a single notification as read. */
export async function markNotificationRead(id: number): Promise<AppNotification> {
  const { data } = await api.patch<AppNotification>(`/notifications/${id}/read`);
  return data;
}

/** Marks every one of the caller's notifications as read. */
export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}

/** Deletes a single notification. */
export async function deleteNotification(id: number): Promise<void> {
  await api.delete(`/notifications/${id}`);
}

/** Fetches the caller's per-type notification preferences. */
export async function getNotificationPreferences(): Promise<NotificationPreference[]> {
  const { data } = await api.get<NotificationPreference[]>('/notifications/preferences');
  return data;
}

/** Bulk-updates the caller's per-type notification preferences. */
export async function updateNotificationPreferences(
  preferences: NotificationPreference[],
): Promise<void> {
  await api.put('/notifications/preferences', { preferences });
}

/** Sends an announcement to every active member (ADMIN only). */
export async function broadcastNotification(payload: CreateBroadcastRequest): Promise<void> {
  await api.post('/notifications/broadcast', payload);
}
