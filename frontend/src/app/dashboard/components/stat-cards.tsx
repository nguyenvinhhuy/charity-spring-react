"use client"

import { HandCoins, HeartHandshake, Megaphone, Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { DashboardSummary } from "@/types/dashboard"
import { formatVnd } from "@/app/campaigns/components/campaign-constants"

interface StatCardsProps {
  summary: DashboardSummary
}

/**
 * Renders the four headline KPI cards summarizing donations, campaigns, donors and members.
 *
 * @param summary the aggregated dashboard summary
 */
export function StatCards({ summary }: StatCardsProps) {
  const { t } = useTranslation()

  const roleSummary = summary.membersByRole.map((r) => `${r.count} ${t(`dashboard.roleShort.${r.role}`)}`).join(" · ")

  const cards = [
    {
      title: t("dashboard.statCards.totalRaised"),
      value: formatVnd(summary.totalRaised),
      footer: t("dashboard.statCards.totalRaisedFooter", {
        count: summary.totalDonors.toLocaleString("vi-VN"),
      }),
      icon: HandCoins,
    },
    {
      title: t("dashboard.statCards.campaigns"),
      value: t("dashboard.statCards.campaignsValue", { count: summary.activeCampaigns }),
      footer: t("dashboard.statCards.campaignsFooter", {
        completed: summary.completedCampaigns,
        total: summary.totalCampaigns,
      }),
      icon: Megaphone,
    },
    {
      title: t("dashboard.statCards.donations"),
      value: summary.totalDonors.toLocaleString("vi-VN"),
      footer: t("dashboard.statCards.donationsFooter"),
      icon: HeartHandshake,
    },
    {
      title: t("dashboard.statCards.members"),
      value: summary.totalMembers.toLocaleString("vi-VN"),
      footer: roleSummary || t("dashboard.statCards.membersEmpty"),
      icon: Users,
    },
  ]

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 @5xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <Icon className="size-4" />
                {card.title}
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{card.value}</CardTitle>
            </CardHeader>
            <CardFooter className="text-muted-foreground text-sm">
              <span className="line-clamp-1">{card.footer}</span>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
