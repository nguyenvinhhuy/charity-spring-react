import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import en from "./locales/en.json"
import vi from "./locales/vi.json"

/** localStorage key holding the user's chosen language. */
export const LANG_STORAGE_KEY = "clb-lang"

export const SUPPORTED_LANGUAGES = ["vi", "en"] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

const stored = localStorage.getItem(LANG_STORAGE_KEY)
const initialLang: Language = stored === "en" || stored === "vi" ? stored : "vi"

void i18n.use(initReactI18next).init({
  resources: {
    vi: { translation: vi },
    en: { translation: en },
  },
  lng: initialLang,
  fallbackLng: "vi",
  interpolation: { escapeValue: false },
})

export default i18n
