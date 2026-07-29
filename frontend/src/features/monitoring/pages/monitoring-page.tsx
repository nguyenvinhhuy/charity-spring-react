"use client"

import { useState } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { RefreshCw } from "lucide-react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { getMonitoringOverview } from "../api"
import type { MetricRange } from "../types"
import { RenderStatusCard } from "../components/render-status-card"
import { VercelStatusCard } from "../components/vercel-status-card"
import { DatabaseStatusCard } from "../components/database-status-card"
import { CloudinaryStatusCard } from "../components/cloudinary-status-card"

/** Matches the backend's default alert threshold fraction (app.alert.threshold-fraction). */
const THRESHOLD_PERCENT = 80
const AUTO_REFRESH_MS = 60_000
const RANGE_OPTIONS: MetricRange[] = ["TWELVE_HOURS", "ONE_DAY", "THREE_DAYS", "SEVEN_DAYS"]

/** Admin-only system monitoring dashboard: Render, Vercel, Database, and Cloudinary status + trend charts. */
export default function MonitoringPage() {
  const { t, i18n } = useTranslation()
  const [range, setRange] = useState<MetricRange>("ONE_DAY")

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["monitoring-overview", range],
    queryFn: () => getMonitoringOverview(range),
    refetchInterval: AUTO_REFRESH_MS,
    // Keeps the previous range's data on screen while a new range loads, instead of blanking the
    // whole grid back to the loading state on every click.
    placeholderData: keepPreviousData,
  })

  return (
    <BaseLayout title={t("monitoring.title")} description={t("monitoring.description")}>
      <div className="@container/main flex flex-col gap-4 px-4 md:gap-6 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-muted-foreground text-sm">
            {data && t("monitoring.lastUpdated", { time: new Date(data.fetchedAt).toLocaleTimeString(i18n.language) })}
            {" · "}
            {t("monitoring.autoRefreshNote")}
          </p>
          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              size="sm"
              value={range}
              onValueChange={(value) => value && setRange(value as MetricRange)}
              className="bg-muted border-border h-8 gap-0.5 rounded-lg border p-0.5"
            >
              {RANGE_OPTIONS.map((option) => (
                <ToggleGroupItem
                  key={option}
                  value={option}
                  className="h-full cursor-pointer rounded-md px-3 text-sm first:rounded-md last:rounded-md hover:bg-background hover:text-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-xs data-[state=on]:hover:bg-primary"
                >
                  {t(`monitoring.range.${option}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
              <RefreshCw className={isFetching ? "animate-spin" : ""} />
              {t("monitoring.refresh")}
            </Button>
          </div>
        </div>

        {isLoading && !data ? (
          <p className="text-muted-foreground py-20 text-center">{t("monitoring.loading")}</p>
        ) : data ? (
          <div
            className={`grid grid-cols-1 gap-4 transition-opacity lg:grid-cols-2 ${isFetching ? "opacity-60" : ""}`}
          >
            <RenderStatusCard status={data.render} range={range} />
            <VercelStatusCard status={data.vercel} range={range} />
            <DatabaseStatusCard status={data.database} thresholdPercent={THRESHOLD_PERCENT} />
            <CloudinaryStatusCard status={data.cloudinary} thresholdPercent={THRESHOLD_PERCENT} />
          </div>
        ) : (
          <p className="text-muted-foreground py-20 text-center">{t("monitoring.empty")}</p>
        )}
      </div>
    </BaseLayout>
  )
}
