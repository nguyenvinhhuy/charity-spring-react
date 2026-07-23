"use client"

import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import { ExternalLink } from "lucide-react"
import { useTranslation } from "react-i18next"
import { PublicLayout } from "@/components/layouts/public-layout"
import { campaignQrUrl, getCampaign, recordCampaignView } from "@/api/campaigns"
import { useRecordView } from "@/hooks/use-record-view"
import type { CampaignDetail } from "@/types"
import { ReactionBar } from "@/components/reaction-bar"
import { ViewCountBadge } from "@/components/view-count-badge"
import { CommentSection } from "@/components/comment-section"
import { CampaignRegistrationCard } from "@/components/campaign-registration-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  categoryLabel,
  formatVnd,
  localized,
  progressPercent,
  statusLabel,
  STATUS_VARIANTS,
} from "@/app/campaigns/components/campaign-constants"

/**
 * Formats an ISO date string as a Vietnamese short date.
 *
 * @param iso the ISO 8601 date string
 */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN")
}

/** Renders the public campaign detail page: full campaign info alongside a VietQR donation card. */
export default function PublicCampaignDetailPage() {
  const { t, i18n } = useTranslation()
  const { slug } = useParams<{ slug: string }>()

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [amount, setAmount] = useState("")

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setNotFound(false)
    getCampaign(slug)
      .then(setCampaign)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  useRecordView(campaign?.id ?? null, recordCampaignView)

  if (loading) {
    return (
      <PublicLayout>
        <p className="text-muted-foreground py-10 text-center text-sm">{t("campaignsPublic.loading")}</p>
      </PublicLayout>
    )
  }

  if (notFound || !campaign) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-lg font-medium">{t("campaignsPublic.notFound")}</p>
          <Button asChild variant="outline">
            <Link to="/campaigns">{t("campaignsPublic.backToList")}</Link>
          </Button>
        </div>
      </PublicLayout>
    )
  }

  const numericAmount = amount ? Number(amount) : undefined

  return (
    <PublicLayout>
      <div className="mb-10 grid gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{categoryLabel(t, campaign.category)}</Badge>
              <Badge variant={STATUS_VARIANTS[campaign.status]}>{statusLabel(t, campaign.status)}</Badge>
              <ViewCountBadge count={campaign.viewCount} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {localized(i18n.language, campaign.title, campaign.titleEn)}
            </h1>
            <ReactionBar target="campaigns" targetId={campaign.id} />
          </div>

          <div className="flex flex-col gap-2">
            <Progress value={progressPercent(campaign.currentAmount, campaign.targetAmount)} />
            <span className="text-muted-foreground text-sm">
              {formatVnd(campaign.currentAmount)} / {formatVnd(campaign.targetAmount)}
              {" · "}
              {t("campaignsPublic.donorCount", { count: campaign.donorCount })}
            </span>
          </div>

          {campaign.eventStartDate && (
            <p className="text-sm">
              {t("campaignsPublic.eventDates")}: {formatDate(campaign.eventStartDate)}
              {campaign.eventEndDate ? ` - ${formatDate(campaign.eventEndDate)}` : ""}
            </p>
          )}

          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {localized(i18n.language, campaign.description, campaign.descriptionEn)}
          </p>

          {campaign.images.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="font-semibold">{t("campaignsPublic.images")}</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {campaign.images.map((url) => (
                  <img key={url} src={url} alt="" className="aspect-video w-full rounded-md object-cover" />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-20 flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("campaignsPublic.donationInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">{t("campaignsPublic.donationAmount")}</label>
                  <Input
                    type="number"
                    min={0}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={t("campaignsPublic.donationAmountPlaceholder")}
                  />
                </div>

                <img
                  src={campaignQrUrl(campaign.slug, numericAmount)}
                  alt="VietQR"
                  className="mx-auto w-full max-w-56 rounded-md border"
                />

                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{t("campaignsPublic.bankAccountNo")}</span>
                    <span className="font-medium">{campaign.bankAccountNo}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{t("campaignsPublic.bankAccountName")}</span>
                    <span className="font-medium">{campaign.bankAccountName}</span>
                  </div>
                  {campaign.qrDescription && (
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">{t("campaignsPublic.transferNote")}</span>
                      <span className="font-medium">{campaign.qrDescription}</span>
                    </div>
                  )}
                </div>

                {campaign.thienNguyenUrl && (
                  <Button asChild variant="outline" className="w-full">
                    <a href={campaign.thienNguyenUrl} target="_blank" rel="noreferrer">
                      <ExternalLink />
                      {t("campaignsPublic.viewOnThienNguyen")}
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {campaign.capacity != null && campaign.eventStartDate && (
              <CampaignRegistrationCard
                campaignId={campaign.id}
                capacity={campaign.capacity}
                eventStartDate={campaign.eventStartDate}
              />
            )}
          </div>
        </div>
      </div>

      <CommentSection target="campaigns" targetId={campaign.id} />
    </PublicLayout>
  )
}
