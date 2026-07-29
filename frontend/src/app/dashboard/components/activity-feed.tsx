"use client"

import { FileText, HandCoins, Megaphone, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ActivityItem, ActivityType } from "@/types/dashboard"
import { formatVnd } from "@/app/campaigns/components/campaign-constants"

interface ActivityFeedProps {
  items: ActivityItem[]
}

const ACTIVITY_ICONS: Record<ActivityType, LucideIcon> = {
  CAMPAIGN_CREATED: Megaphone,
  DONATION_ADDED: HandCoins,
  POST_CREATED: FileText,
}

/**
 * Builds the localized action phrase describing an activity item.
 *
 * @param t translation function
 * @param item the activity item
 */
function actionText(t: TFunction, item: ActivityItem): string {
  switch (item.type) {
    case "CAMPAIGN_CREATED":
      return t("dashboard.activityFeed.campaignCreated")
    case "DONATION_ADDED":
      return t("dashboard.activityFeed.donationAdded", { amount: formatVnd(item.amount) })
    case "POST_CREATED":
      return t("dashboard.activityFeed.postCreated")
  }
}

/** Formats an ISO timestamp as a Vietnamese short date, or an empty string when absent. */
function formatWhen(at: string | null): string {
  return at ? new Date(at).toLocaleDateString("vi-VN") : ""
}

/**
 * Renders a scrollable feed of recent activity with a type icon, actor, action and time.
 *
 * @param items the recent activity items, most recent first
 */
export function ActivityFeed({ items }: ActivityFeedProps) {
  const { t } = useTranslation()

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{t("dashboard.activityFeed.title")}</CardTitle>
        <CardDescription>{t("dashboard.activityFeed.description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {items.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center text-sm">{t("dashboard.activityFeed.empty")}</p>
        ) : (
          <ul className="flex max-h-[360px] flex-col gap-4 overflow-y-auto pr-1">
            {items.map((item, index) => {
              const Icon = ACTIVITY_ICONS[item.type]
              const when = formatWhen(item.at)
              return (
                <li key={index} className="flex items-start gap-3">
                  <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
                    <Icon className="size-4" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="text-sm leading-snug">
                      <span className="font-medium">{item.actorName ?? t("dashboard.activityFeed.systemActor")}</span>{" "}
                      {actionText(t, item)} <span className="text-muted-foreground">"{item.title}"</span>
                    </p>
                    {when && <span className="text-muted-foreground text-xs">{when}</span>}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
