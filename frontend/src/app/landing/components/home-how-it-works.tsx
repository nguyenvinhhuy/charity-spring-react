"use client"

import { useTranslation } from "react-i18next"
import { QrCode, Search, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const STEPS = [
  { icon: Search, titleKey: "home.step1Title", descKey: "home.step1Desc" },
  { icon: QrCode, titleKey: "home.step2Title", descKey: "home.step2Desc" },
  { icon: TrendingUp, titleKey: "home.step3Title", descKey: "home.step3Desc" },
] as const

/** Renders the 3-step donation flow as an icon list (no cards), giving the home page a layout distinct from the surrounding grids. */
export function HomeHowItWorks() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 lg:px-6">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <Badge variant="outline" className="mb-3">
          {t("home.howItWorksBadge")}
        </Badge>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("home.howItWorksTitle")}</h2>
        <p className="text-muted-foreground mt-3">{t("home.howItWorksSubtitle")}</p>
      </div>

      <ol className="grid grid-cols-1 gap-10 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.titleKey} className="relative flex flex-col items-center text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <step.icon className="size-6" />
            </div>
            <span className="text-muted-foreground/60 mb-1 text-xs font-semibold tracking-widest uppercase">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="font-semibold">{t(step.titleKey)}</h3>
            <p className="text-muted-foreground mt-1 text-sm">{t(step.descKey)}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
