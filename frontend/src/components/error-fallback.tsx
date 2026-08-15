"use client"

import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"

/** Friendly fallback UI shown by ErrorBoundary when a component crashes during render. */
export function ErrorFallback() {
  const { t } = useTranslation()
  return (
    <div className="mx-auto flex min-h-dvh flex-col items-center justify-center gap-8 p-8 text-center md:gap-12 md:p-16">
      <div>
        <h1 className="mb-4 text-3xl font-bold">{t("errors.crash.title")}</h1>
        <p className="text-muted-foreground">{t("errors.crash.description")}</p>
        <div className="mt-6 flex items-center justify-center gap-4 md:mt-8">
          <Button onClick={() => window.location.assign("/dashboard")}>{t("errors.goHome")}</Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            {t("errors.crash.reload")}
          </Button>
        </div>
      </div>
    </div>
  )
}
