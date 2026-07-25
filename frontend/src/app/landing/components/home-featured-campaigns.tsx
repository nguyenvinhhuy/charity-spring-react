"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { HeartHandshake } from "lucide-react"
import { listCampaigns } from "@/api/campaigns"
import type { CampaignSummary } from "@/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  STATUS_BADGE_CLASSES,
  categoryLabel,
  formatVnd,
  localized,
  progressPercent,
  statusLabel,
} from "@/app/campaigns/components/campaign-constants"

const FEATURED_COUNT = 3

/** Renders one campaign as a vertical card: full-width thumbnail on top, title and details below. */
function FeaturedCampaignCard({ campaign }: { campaign: CampaignSummary }) {
  const { t, i18n } = useTranslation()
  return (
    <Link to={`/campaigns/${campaign.slug}`} className="group">
      <Card className="h-full overflow-hidden py-0 transition-all hover:-translate-y-1 hover:shadow-lg">
        <div className="aspect-[3/2] w-full overflow-hidden">
          {campaign.thumbnailUrl ? (
            <img
              src={campaign.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="bg-muted flex h-full w-full items-center justify-center">
              <HeartHandshake className="text-muted-foreground/40 size-10" />
            </div>
          )}
        </div>
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{categoryLabel(t, campaign.category)}</Badge>
            <Badge className={STATUS_BADGE_CLASSES[campaign.status]}>{statusLabel(t, campaign.status)}</Badge>
          </div>
          <h3 className="group-hover:text-primary line-clamp-2 font-semibold transition-colors">
            {localized(i18n.language, campaign.title, campaign.titleEn)}
          </h3>
          <Progress value={progressPercent(campaign.currentAmount, campaign.targetAmount)} />
          <p className="text-muted-foreground text-sm">
            {formatVnd(campaign.currentAmount)} / {formatVnd(campaign.targetAmount)}
            {" · "}
            {t("campaignsPublic.donorCount", { count: campaign.donorCount })}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

/** Renders up to 3 active campaigns on the home page as equal-size vertical cards (thumbnail on top). */
export function HomeFeaturedCampaigns() {
  const { t } = useTranslation()
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([])

  useEffect(() => {
    let active = true
    listCampaigns({ status: "ACTIVE", size: FEATURED_COUNT })
      .then((result) => {
        if (active) setCampaigns(result.content)
      })
      .catch(() => {
        // Non-critical decorative section: fail silently.
      })
    return () => {
      active = false
    }
  }, [])

  if (campaigns.length === 0) return null

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="outline" className="mb-3 flex w-fit items-center gap-2">
            <HeartHandshake className="size-3" />
            {t("home.featuredCampaignsBadge")}
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("home.featuredCampaignsTitle")}</h2>
        </div>
        <Button variant="ghost" asChild>
          <Link to="/campaigns">{t("home.viewAll")}</Link>
        </Button>
      </div>

      <div
        className={cn(
          "grid grid-cols-1 gap-6",
          campaigns.length >= 2 && "sm:grid-cols-2",
          campaigns.length >= 3 && "lg:grid-cols-3"
        )}
      >
        {campaigns.map((campaign) => (
          <FeaturedCampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>
    </section>
  )
}
