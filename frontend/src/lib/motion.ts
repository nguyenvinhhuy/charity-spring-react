import type { Variants } from "motion/react"

/** Fades and slides an element up into place; pair with `initial`/`whileInView` or `initial`/`animate`. */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
}

/** Staggers the entrance of direct motion children; apply to the parent alongside `fadeInUp` on each child. */
export const staggerChildren: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

/** Shared viewport options: animate once, slightly before the section fully enters view. */
export const revealOnce = { once: true, amount: 0.2 } as const
