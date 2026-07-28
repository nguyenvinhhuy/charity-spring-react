export type NotificationType =
  | 'COMMENT_MENTION'
  | 'CAMPAIGN_STATUS_CHANGED'
  | 'REGISTRATION_CREATED'
  | 'REGISTRATION_CANCELLED'
  | 'REGISTRATION_REMOVED'
  | 'DONATION_RECEIVED'
  | 'INQUIRY_RECEIVED'
  | 'BROADCAST';

export type NotificationReferenceType = 'CAMPAIGN' | 'POST' | 'INQUIRY';

export interface AppNotification {
  id: number;
  type: NotificationType;
  actorName: string | null;
  referenceType: NotificationReferenceType | null;
  referenceId: number | null;
  referenceTitle: string | null;
  detail: string | null;
  title: string | null;
  message: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationPreference {
  type: NotificationType;
  enabled: boolean;
}

export interface CreateBroadcastRequest {
  title: string;
  message: string;
}
