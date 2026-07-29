"use client"

import { useState } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { BaseLayout } from "@/components/layouts/base-layout"
import { getDashboardSummary } from "@/api/dashboard"
import type { Granularity } from "@/types/common"
import { StatCards } from "./components/stat-cards"
import { DonationsTrend } from "./components/donations-trend"
import { CategoryDonut } from "./components/category-donut"
import { CampaignProgressChart } from "./components/campaign-progress-chart"
import { MembersDonut } from "./components/members-donut"
import { TopCampaigns } from "./components/top-campaigns"
import { ActivityFeed } from "./components/activity-feed"
import { QuickActions } from "./components/quick-actions"

/** Renders the admin dashboard: headline stats, donation trends, campaign progress, and recent activity. */
export default function DashboardPage() {
  const { t } = useTranslation()
  const [granularity, setGranularity] = useState<Granularity>("MONTH")

  const { data, isLoading: loading } = useQuery({
    queryKey: ["dashboard-summary", granularity],
    queryFn: () => getDashboardSummary(granularity),
    // Keeps the previous granularity's charts on screen while the next one loads.
    placeholderData: keepPreviousData,
  })

  return (
    <BaseLayout title={t("dashboard.title")} description={t("dashboard.description")}>
      <div className="@container/main flex flex-col gap-4 px-4 md:gap-6 lg:px-6">
        <div className="flex justify-end">
          <QuickActions />
        </div>

        {loading && !data ? (
          <p className="text-muted-foreground py-20 text-center">{t("dashboard.loading")}</p>
        ) : data ? (
          <div className="flex flex-col gap-4 md:gap-6">
            <StatCards summary={data} />

            <div className="grid grid-cols-1 gap-4 md:gap-6 @5xl:grid-cols-3">
              <div className="@5xl:col-span-2">
                <DonationsTrend
                  data={data.donationSeries}
                  granularity={granularity}
                  onGranularityChange={setGranularity}
                />
              </div>
              <CategoryDonut items={data.amountByCategory} />
            </div>

            <div className="grid grid-cols-1 gap-4 md:gap-6 @5xl:grid-cols-3">
              <div className="@5xl:col-span-2">
                <CampaignProgressChart items={data.campaignProgress} />
              </div>
              <MembersDonut items={data.membersByRole} />
            </div>

            <div className="grid grid-cols-1 gap-4 md:gap-6 @5xl:grid-cols-2">
              <TopCampaigns items={data.campaignProgress} />
              <ActivityFeed items={data.recentActivity} />
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground py-20 text-center">{t("dashboard.empty")}</p>
        )}
      </div>
    </BaseLayout>
  )
}
