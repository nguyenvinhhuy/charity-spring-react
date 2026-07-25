"use client"

import { useTranslation } from "react-i18next"
import { HeartHandshake } from "lucide-react"
import { Badge } from "@/components/ui/badge"

/** Renders the About page's mission statement: badge, heading, and a short paragraph. */
export function AboutMission() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center lg:px-6">
      <Badge variant="outline" className="mb-3 flex w-fit items-center gap-2 mx-auto">
        <HeartHandshake className="size-3" />
        {t("aboutPublic.missionBadge")}
      </Badge>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("aboutPublic.missionTitle")}</h2>
      <p className="text-muted-foreground mt-4 text-lg leading-relaxed">{t("aboutPublic.missionBody")}</p>
    </section>
  )
}
