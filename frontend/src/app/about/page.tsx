"use client"

import { useTranslation } from "react-i18next"
import { PublicLayout } from "@/components/layouts/public-layout"
import { AboutMission } from "./components/about-mission"
import { AboutStory } from "./components/about-story"
import { AboutTeam } from "./components/about-team"

/** Renders the public About page: mission statement, founding story, and the team section. */
export default function AboutPage() {
  const { t } = useTranslation()

  return (
    <PublicLayout title={t("aboutPublic.title")} description={t("aboutPublic.description")}>
      <AboutMission />
      <AboutStory />
      <AboutTeam />
    </PublicLayout>
  )
}
