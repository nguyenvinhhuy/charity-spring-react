"use client"

import { useTranslation } from "react-i18next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { CampaignProgressItem } from "@/types/dashboard"
import { formatVnd, localized, statusLabel, STATUS_BADGE_CLASSES } from "@/app/campaigns/components/campaign-constants"

interface TopCampaignsProps {
  items: CampaignProgressItem[]
}

const TOP_COUNT = 5

/**
 * Renders a ranked list of the top campaigns by amount raised, each with a progress bar and status.
 *
 * @param items the campaign progress items, already sorted by current amount descending
 */
export function TopCampaigns({ items }: TopCampaignsProps) {
  const { t, i18n } = useTranslation()
  const top = items.slice(0, TOP_COUNT)

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{t("dashboard.topCampaigns.title")}</CardTitle>
        <CardDescription>{t("dashboard.topCampaigns.description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {top.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center text-sm">{t("dashboard.noData")}</p>
        ) : (
          top.map((item, index) => (
            <div key={item.id} className="flex items-center gap-3">
              <span className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums">
                {index + 1}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{localized(i18n.language, item.title, item.titleEn)}</span>
                  <Badge className={`shrink-0 ${STATUS_BADGE_CLASSES[item.status]}`}>
                    {statusLabel(t, item.status)}
                  </Badge>
                </div>
                <Progress value={item.percent} />
                <div className="text-muted-foreground flex items-center justify-between text-xs">
                  <span>{formatVnd(item.currentAmount)}</span>
                  <span>{item.percent}%</span>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
