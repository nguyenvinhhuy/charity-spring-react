import type { InquiryStatus } from "@/types/inquiry"

/** Shared Tailwind classes for simple two-state (active/inactive, published/draft) status badges. */
export const STATUS_BADGE_ACTIVE =
  "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
export const STATUS_BADGE_INACTIVE =
  "border-transparent bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400"

/** Tailwind classes giving each inquiry status a distinct, readable badge color. */
export const INQUIRY_STATUS_BADGE_CLASSES: Record<InquiryStatus, string> = {
  NEW: "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  HANDLED: STATUS_BADGE_ACTIVE,
}
