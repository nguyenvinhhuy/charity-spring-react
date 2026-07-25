"use client"

import { useTranslation } from "react-i18next"

const MILESTONES = [
  { year: "2018", titleKey: "aboutPublic.milestone1Title", descKey: "aboutPublic.milestone1Desc" },
  { year: "2020", titleKey: "aboutPublic.milestone2Title", descKey: "aboutPublic.milestone2Desc" },
  { year: "2022", titleKey: "aboutPublic.milestone3Title", descKey: "aboutPublic.milestone3Desc" },
  { year: "2024", titleKey: "aboutPublic.milestone4Title", descKey: "aboutPublic.milestone4Desc" },
] as const

/** Renders the About page's founding story and a static timeline of milestones. */
export function AboutStory() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 lg:px-6">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("aboutPublic.storyTitle")}</h2>
        <p className="text-muted-foreground mt-3">{t("aboutPublic.storyBody")}</p>
      </div>

      <ol className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        {MILESTONES.map((milestone) => (
          <li key={milestone.year} className="flex gap-4">
            <span className="text-primary shrink-0 text-2xl font-bold tabular-nums">{milestone.year}</span>
            <div>
              <h3 className="font-semibold">{t(milestone.titleKey)}</h3>
              <p className="text-muted-foreground mt-1 text-sm">{t(milestone.descKey)}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
