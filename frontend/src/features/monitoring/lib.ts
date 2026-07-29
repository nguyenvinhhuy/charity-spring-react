import { CHART_COLORS } from "@/app/dashboard/components/dashboard-constants"

const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB"]

/**
 * Formats a byte count into a short human-readable string (e.g. "128 MB").
 *
 * @param bytes the byte count
 */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B"
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), BYTE_UNITS.length - 1)
  const value = bytes / 1024 ** exponent
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${BYTE_UNITS[exponent]}`
}

/**
 * Formats a duration in seconds into a short human-readable string (e.g. "1m 5s").
 *
 * @param totalSeconds the duration in seconds
 */
export function formatBuildDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`
}

/**
 * Computes the used/limit fraction as a 0-100 percentage, clamped and rounded.
 *
 * @param used bytes used
 * @param limit bytes available
 */
export function usagePercent(used: number, limit: number): number {
  if (limit <= 0) return 0
  return Math.min(100, Math.round((used / limit) * 100))
}

// Reuses the dashboard's existing categorical chart palette rather than a separately invented set.
export const USED_CATEGORY_COLORS = CHART_COLORS

// 75% of the alert threshold — an earlier amber warning before the badge itself flips to DEGRADED.
const WARNING_THRESHOLD_RATIO = 0.75

/**
 * Picks the usage-bar fill color for a percent value against the given alert threshold.
 *
 * @param percent current usage, 0-100
 * @param thresholdPercent the alert threshold, 0-100 (e.g. 80)
 */
export function usageBarColorClass(percent: number, thresholdPercent: number): string {
  if (percent >= thresholdPercent) return "bg-destructive"
  if (percent >= thresholdPercent * WARNING_THRESHOLD_RATIO) return "bg-amber-500"
  return "bg-primary"
}

/**
 * Formats an ISO timestamp into an axis tick label, using the format that fits the selected range.
 *
 * @param iso the ISO timestamp
 * @param range the selected time window
 * @param locale the current i18n language (drives date/time formatting)
 */
export function formatChartTick(
  iso: string,
  range: "TWELVE_HOURS" | "ONE_DAY" | "THREE_DAYS" | "SEVEN_DAYS",
  locale: string,
): string {
  const date = new Date(iso)
  switch (range) {
    case "TWELVE_HOURS":
    case "ONE_DAY":
      return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
    case "THREE_DAYS":
      return date.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", hour: "2-digit" })
    case "SEVEN_DAYS":
      return date.toLocaleDateString(locale, { weekday: "short", day: "2-digit" })
  }
}
