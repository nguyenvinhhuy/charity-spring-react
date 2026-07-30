import type { TFunction } from "i18next"
import { z } from "zod"

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 100
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/

/** Builds a password field schema enforcing the club's shared password policy, mirroring the backend's `@ValidPassword`. */
export function buildPasswordFieldSchema(t: TFunction) {
  return z
    .string()
    .min(PASSWORD_MIN_LENGTH, t("common.validation.password.min", { min: PASSWORD_MIN_LENGTH }))
    .max(PASSWORD_MAX_LENGTH, t("common.validation.password.max", { max: PASSWORD_MAX_LENGTH }))
    .regex(/[A-Z]/, t("common.validation.password.uppercase"))
    .regex(/[0-9]/, t("common.validation.password.digit"))
    .regex(SPECIAL_CHAR_REGEX, t("common.validation.password.special"))
}
