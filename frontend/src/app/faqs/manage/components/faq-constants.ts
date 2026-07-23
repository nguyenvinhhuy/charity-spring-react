import type { TFunction } from "i18next"

/** Fixed set of FAQ category keys; the backend stores `category` as a plain string, so translation happens entirely on the frontend. */
export const FAQ_CATEGORIES = ["general", "donation", "account", "activities"] as const

export type FaqCategoryKey = (typeof FAQ_CATEGORIES)[number]

/**
 * Returns the localized label for a FAQ category key, falling back to the raw value for anything
 * that isn't one of the known keys (e.g. legacy free-text categories) and to "uncategorized" when empty.
 *
 * @param t the translation function
 * @param category the FAQ's stored category value
 */
export function faqCategoryLabel(t: TFunction, category: string | null | undefined): string {
  const key = category?.trim().toLowerCase()
  if (key && (FAQ_CATEGORIES as readonly string[]).includes(key)) {
    return t(`faqCategory.${key}`)
  }
  return category?.trim() || t("faqsPublic.uncategorized")
}
