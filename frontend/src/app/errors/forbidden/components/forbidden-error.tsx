"use client"

import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"

/** Renders the 403 forbidden state with actions to go home or contact support. */
export function ForbiddenError() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex min-h-dvh flex-col items-center justify-center gap-8 p-8 md:gap-12 md:p-16">
      <ShieldAlert className="text-muted-foreground h-32 w-32" strokeWidth={1} />
      <div className="text-center">
        <h1 className="mb-4 text-3xl font-bold">403</h1>
        <h2 className="mb-3 text-2xl font-semibold">{t("errors.forbidden.title")}</h2>
        <p>{t("errors.forbidden.description")}</p>
        <div className="mt-6 flex items-center justify-center gap-4 md:mt-8">
          <Button className="cursor-pointer" onClick={() => navigate("/dashboard")}>
            {t("errors.goHome")}
          </Button>
          <Button
            variant="outline"
            className="flex cursor-pointer items-center gap-1"
            onClick={() => navigate("/contact")}
          >
            {t("errors.contactUs")}
          </Button>
        </div>
      </div>
    </div>
  )
}
