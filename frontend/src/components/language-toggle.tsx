"use client"

import { Check } from "lucide-react"
import { useTranslation } from "react-i18next"

import enFlag from "@/assets/images/en.svg"
import vnFlag from "@/assets/images/vn.svg"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LANG_STORAGE_KEY, SUPPORTED_LANGUAGES, type Language } from "@/i18n"
import { cn } from "@/lib/utils"

const FLAGS: Record<Language, string> = {
  vi: vnFlag,
  en: enFlag,
}

/** Header control to switch the UI language (Vietnamese / English) using flag icons. */
export function LanguageToggle() {
  const { t, i18n } = useTranslation()
  const current = (i18n.resolvedLanguage as Language) in FLAGS
    ? (i18n.resolvedLanguage as Language)
    : "vi"

  /**
   * Switches the active UI language and persists the choice for future visits.
   *
   * @param lang the language code to switch to
   */
  function changeLanguage(lang: Language) {
    void i18n.changeLanguage(lang)
    localStorage.setItem(LANG_STORAGE_KEY, lang)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="cursor-pointer">
          <img
            src={FLAGS[current]}
            alt={t(`language.${current}`)}
            className="h-4 w-6 rounded-[2px] object-cover"
          />
          <span className="sr-only">{t("language.title")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuLabel className="text-muted-foreground text-xs uppercase">
          {t("language.title")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SUPPORTED_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang}
            className="cursor-pointer gap-2"
            onClick={() => changeLanguage(lang)}
          >
            <img
              src={FLAGS[lang]}
              alt=""
              aria-hidden="true"
              className="h-4 w-6 rounded-[2px] object-cover"
            />
            <span className="flex-1">{t(`language.${lang}`)}</span>
            <Check className={cn("h-4 w-4", current === lang ? "opacity-100" : "opacity-0")} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
