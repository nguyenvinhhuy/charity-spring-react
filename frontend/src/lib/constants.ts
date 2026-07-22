import type { CampaignCategory, CampaignStatus, Role } from '@/types';

/** Default number of items per page for paginated lists. */
export const DEFAULT_PAGE_SIZE = 9;

/** Page size used inside admin tables. */
export const ADMIN_PAGE_SIZE = 20;

/** Maximum allowed image upload size in bytes (5 MB). */
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

/** MIME types accepted by the image upload component. */
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** Human-readable Vietnamese labels for campaign categories. */
export const CATEGORY_LABELS: Record<CampaignCategory, string> = {
  CHILDREN: 'Trẻ em',
  EDUCATION: 'Giáo dục',
  HEALTHCARE: 'Y tế',
  DISASTER_RELIEF: 'Cứu trợ thiên tai',
  ELDERLY: 'Người già',
  ENVIRONMENT: 'Môi trường',
  OTHER: 'Khác',
};

/** Human-readable Vietnamese labels for campaign statuses. */
export const STATUS_LABELS: Record<CampaignStatus, string> = {
  DRAFT: 'Bản nháp',
  ACTIVE: 'Đang diễn ra',
  COMPLETED: 'Đã hoàn thành',
  CLOSED: 'Đã đóng',
  ARCHIVED: 'Đã lưu trữ',
};

/** Human-readable Vietnamese labels for member roles. */
export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Quản trị viên',
  CONTRIBUTOR: 'Cộng tác viên',
  MEMBER: 'Thành viên',
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(
  ([value, label]) => ({ value: value as CampaignCategory, label }),
);

export const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(
  ([value, label]) => ({ value: value as CampaignStatus, label }),
);

export const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(
  ([value, label]) => ({ value: value as Role, label }),
);
