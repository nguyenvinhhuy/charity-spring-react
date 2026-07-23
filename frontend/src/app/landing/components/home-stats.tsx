"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { HandCoins, HeartHandshake, Users } from "lucide-react"
import { getPublicCampaignStats } from "@/api/campaigns"
import type { PublicCampaignStats } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { DotPattern } from "@/components/dot-pattern"
import { formatVnd } from "@/app/campaigns/components/campaign-constants"

/** Renders the home page's public donation/campaign totals, fetched from the public stats endpoint. */
export function HomeStats() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<PublicCampaignStats | null>(null)

  useEffect(() => {
    let active = true
    getPublicCampaignStats()
      .then((result) => {
        if (active) setStats(result)
      })
      .catch(() => {
        // Non-critical decorative section: fail silently, just don't render numbers.
      })
    return () => {
      active = false
    }
  }, [])

  if (!stats) return null

  const items = [
    { icon: HandCoins, value: formatVnd(stats.totalRaised), label: t("home.statsRaised") },
    { icon: HeartHandshake, value: String(stats.activeCount), label: t("home.statsCampaigns") },
    { icon: Users, value: String(stats.totalDonors), label: t("home.statsDonors") },
  ]

  return (
    <section className="relative -mx-4 py-12 sm:py-16 lg:-mx-6">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/8 via-transparent to-secondary/20" />
      <DotPattern className="opacity-75" size="md" fadeStyle="circle" />

      <div className="relative mx-auto max-w-6xl px-4 lg:px-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 md:gap-8">
          {items.map((item) => (
            <Card key={item.label} className="border-border/50 bg-background/60 py-0 text-center backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-xl bg-primary/10 p-3">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <p className="text-2xl font-bold tracking-tight sm:text-3xl">{item.value}</p>
                <p className="text-muted-foreground mt-1 text-sm">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
