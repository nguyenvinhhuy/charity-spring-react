"use client"

import { useState } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Link } from "react-router"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import { PublicLayout } from "@/components/layouts/public-layout"
import { listCampaigns } from "@/api/campaigns"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import type { CampaignStatus } from "@/types/campaign"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  categoryLabel,
  formatVnd,
  localized,
  progressPercent,
  statusLabel,
  STATUS_BADGE_CLASSES,
} from "@/app/campaigns/components/campaign-constants"

const PAGE_SIZE = 12

/** Public statuses selectable in the list filter: DRAFT and ARCHIVED campaigns must never be reachable here. */
type PublicCampaignStatus = Extract<CampaignStatus, "ACTIVE" | "COMPLETED" | "CLOSED">

const PUBLIC_STATUS_OPTIONS: PublicCampaignStatus[] = ["ACTIVE", "COMPLETED", "CLOSED"]

/** Renders the public campaign list page: a searchable, filterable, paginated grid of campaign cards. */
export default function PublicCampaignsPage() {
  const { t, i18n } = useTranslation()

  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<PublicCampaignStatus>("ACTIVE")
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search)

  const { data, isLoading: loading } = useQuery({
    queryKey: ["campaigns", "public", { page, statusFilter, debouncedSearch }],
    queryFn: () =>
      listCampaigns({
        page,
        size: PAGE_SIZE,
        status: statusFilter,
        search: debouncedSearch || undefined,
      }),
    // Keeps the previous page/filter's cards on screen while the next one loads.
    placeholderData: keepPreviousData,
  })

  const campaigns = data?.content ?? []

  return (
    <PublicLayout title={t("campaignsPublic.title")} description={t("campaignsPublic.description")}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
                placeholder={t("campaignsPublic.searchPlaceholder")}
                className="w-64 pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as PublicCampaignStatus)
                setPage(0)
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PUBLIC_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabel(t, status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground text-sm">
              {t("campaignsPublic.total", { count: data?.totalElements ?? 0 })}
            </span>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground py-10 text-center text-sm">{t("campaignsPublic.loading")}</p>
        ) : campaigns.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center text-sm">{t("campaignsPublic.empty")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => (
              <Link key={campaign.id} to={`/campaigns/${campaign.slug}`}>
                <Card className="h-full overflow-hidden py-0 transition-shadow hover:shadow-md">
                  {campaign.thumbnailUrl ? (
                    <img src={campaign.thumbnailUrl} alt="" className="aspect-[3/2] w-full object-cover" />
                  ) : (
                    <div className="bg-muted aspect-[3/2] w-full" />
                  )}
                  <CardContent className="flex flex-col gap-3 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{categoryLabel(t, campaign.category)}</Badge>
                      <Badge className={STATUS_BADGE_CLASSES[campaign.status]}>{statusLabel(t, campaign.status)}</Badge>
                    </div>
                    <h3 className="line-clamp-2 font-semibold">
                      {localized(i18n.language, campaign.title, campaign.titleEn)}
                    </h3>
                    <div className="flex flex-col gap-1">
                      <Progress value={progressPercent(campaign.currentAmount, campaign.targetAmount)} />
                      <span className="text-muted-foreground text-xs">
                        {formatVnd(campaign.currentAmount)} / {formatVnd(campaign.targetAmount)}
                        {" · "}
                        {t("campaignsPublic.donorCount", { count: campaign.donorCount })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-4">
          <span className="text-muted-foreground text-sm">
            {t("common.page", { current: (data?.number ?? 0) + 1, total: data?.totalPages ?? 1 })}
          </span>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={t("common.previousPage")}
                  disabled={loading || (data?.first ?? true)}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("common.previousPage")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={t("common.nextPage")}
                  disabled={loading || (data?.last ?? true)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("common.nextPage")}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
