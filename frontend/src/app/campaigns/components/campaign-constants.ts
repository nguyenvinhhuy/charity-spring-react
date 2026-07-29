import type { TFunction } from "i18next"
import type { CampaignCategory, CampaignStatus } from "@/types/campaign"

/** All campaign statuses, in lifecycle order. */
export const STATUS_OPTIONS: CampaignStatus[] = ["DRAFT", "ACTIVE", "COMPLETED", "CLOSED", "ARCHIVED"]

/** All campaign categories. */
export const CATEGORY_OPTIONS: CampaignCategory[] = [
  "CHILDREN",
  "EDUCATION",
  "HEALTHCARE",
  "DISASTER_RELIEF",
  "ELDERLY",
  "ENVIRONMENT",
  "OTHER",
]

/** Tailwind classes giving each campaign status a distinct, readable badge color. */
export const STATUS_BADGE_CLASSES: Record<CampaignStatus, string> = {
  DRAFT: "border-transparent bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400",
  ACTIVE: "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  COMPLETED: "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  CLOSED: "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  ARCHIVED: "border-transparent bg-slate-200 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400",
}

/**
 * Returns the localized label for a campaign status.
 *
 * @param t the translation function
 * @param status the campaign status
 */
export function statusLabel(t: TFunction, status: CampaignStatus): string {
  return t(`campaigns.status.${status}`)
}

/**
 * Returns the localized label for a campaign category.
 *
 * @param t the translation function
 * @param category the campaign category
 */
export function categoryLabel(t: TFunction, category: CampaignCategory): string {
  return t(`campaigns.category.${category}`)
}

// Mirrors the backend CampaignStatus lifecycle: DRAFT → ACTIVE → COMPLETED, ACTIVE → CLOSED → ARCHIVED.
const ALLOWED_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  DRAFT: ["ACTIVE"],
  ACTIVE: ["COMPLETED", "CLOSED"],
  COMPLETED: [],
  CLOSED: ["ARCHIVED"],
  ARCHIVED: [],
}

/**
 * Returns the statuses a campaign in the given status may transition to.
 *
 * @param status the campaign's current status
 */
export function allowedTransitions(status: CampaignStatus): CampaignStatus[] {
  return ALLOWED_TRANSITIONS[status]
}

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
})

/**
 * Formats an amount of Vietnamese đồng as a localized currency string.
 *
 * @param amount the amount in đồng
 * @returns a string such as "1.000.000 ₫"
 */
export function formatVnd(amount: number): string {
  return currencyFormatter.format(amount)
}

/**
 * Returns the funding progress as an integer percentage capped at 100.
 *
 * @param current the amount raised so far
 * @param target the campaign's funding goal
 * @returns an integer between 0 and 100
 */
export function progressPercent(current: number, target: number): number {
  if (target <= 0) return 0
  return Math.min(100, Math.round((current / target) * 100))
}

/**
 * Picks the English text when the active language is English and it exists, else the Vietnamese text.
 *
 * @param lang the active i18n language code
 * @param vi the Vietnamese text
 * @param en the English text, when available
 * @returns whichever of vi or en applies
 */
export function localized(lang: string, vi: string, en: string | null): string {
  return lang.startsWith("en") && en ? en : vi
}
