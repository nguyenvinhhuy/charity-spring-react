import type { Role } from "@/types"

/** Display order for roles: highest privilege first. */
export const ROLE_ORDER: Record<Role, number> = {
  ADMIN: 0,
  CONTRIBUTOR: 1,
  MEMBER: 2,
}

/** The five categorical chart CSS variables cycled through by donut/pie slices. */
export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const

const compactFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 1,
})

/**
 * Formats an amount of Vietnamese đồng compactly using tỷ/tr/k suffixes for chart axes.
 *
 * @param amount the amount in đồng
 * @returns a short human-readable string such as "6,5tr"
 */
export function compactVnd(amount: number): string {
  if (amount >= 1_000_000_000) return `${compactFormatter.format(amount / 1_000_000_000)}tỷ`
  if (amount >= 1_000_000) return `${compactFormatter.format(amount / 1_000_000)}tr`
  if (amount >= 1_000) return `${compactFormatter.format(amount / 1_000)}k`
  return compactFormatter.format(amount)
}
