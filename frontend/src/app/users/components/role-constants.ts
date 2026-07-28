import type { Role } from "@/types/common"

export { STATUS_BADGE_ACTIVE, STATUS_BADGE_INACTIVE } from "@/lib/status-badges"

/** Tailwind classes giving each role a distinct, readable badge color. */
export const ROLE_BADGE_CLASSES: Record<Role, string> = {
  ADMIN: "border-transparent bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  CONTRIBUTOR: "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  MEMBER: "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
}
