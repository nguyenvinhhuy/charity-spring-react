import type { TFunction } from "i18next"
import type { CampaignCategory, CampaignStatus } from "@/types"

type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

/** All campaign statuses, in lifecycle order. */
export const STATUS_OPTIONS: CampaignStatus[] = [
  "DRAFT",
  "ACTIVE",
  "COMPLETED",
  "CLOSED",
  "ARCHIVED",
]

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

/** Badge variant used to color each status. */
export const STATUS_VARIANTS: Record<CampaignStatus, BadgeVariant> = {
  DRAFT: "secondary",
  ACTIVE: "default",
  COMPLETED: "default",
  CLOSED: "outline",
  ARCHIVED: "outline",
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
