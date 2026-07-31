"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { formatDistanceToNow } from "date-fns"
import { vi as viLocale, enUS } from "date-fns/locale"
import { useTranslation } from "react-i18next"
import { Globe } from "lucide-react"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { CHART_COLORS } from "@/app/dashboard/components/dashboard-constants"
import { formatChartTick } from "../lib"
import { ServiceStatusCard } from "./service-status-card"
import type { MetricRange, SystemStatus, VercelStatus } from "../types"

interface VercelStatusCardProps {
  status: VercelStatus
  range: MetricRange
}

function toSystemStatus(status: VercelStatus["status"]): SystemStatus {
  switch (status) {
    case "READY":
      return "OK"
    case "BUILDING":
      return "DEGRADED"
    case "ERROR":
      return "ERROR"
    default:
      return "NOT_CONFIGURED"
  }
}

/** Monitoring card for the Vercel-hosted frontend: latest deploy status + recent build-time trend. */
export function VercelStatusCard({ status, range }: VercelStatusCardProps) {
  const { t, i18n } = useTranslation()
  const dateLocale = i18n.language === "vi" ? viLocale : enUS

  const chartConfig = {
    buildSeconds: { label: t("monitoring.vercel.buildDuration"), color: CHART_COLORS[2] },
  } satisfies ChartConfig

  const chartData = status.recentBuilds.map((point) => ({
    time: formatChartTick(point.deployedAt, range, i18n.language),
    buildSeconds: point.buildSeconds,
  }))

  const latestDeployedAt = status.recentBuilds[status.recentBuilds.length - 1]?.deployedAt

  return (
    <ServiceStatusCard
      icon={<Globe className="text-muted-foreground size-5" />}
      title={t("monitoring.vercel.title")}
      description={t("monitoring.vercel.description")}
      status={toSystemStatus(status.status)}
      statusLabel={t(`monitoring.status.${toSystemStatus(status.status)}`)}
      infoTooltip={t("monitoring.vercel.metricsNote")}
    >
      {status.errorMessage ? (
        <p className="text-destructive text-sm">{status.errorMessage}</p>
      ) : !status.configured ? (
        <p className="text-muted-foreground text-sm">{t("monitoring.notConfigured")}</p>
      ) : (
        <>
          {latestDeployedAt && (
            <p className="text-muted-foreground text-sm">
              {t("monitoring.vercel.lastDeploy")} ·{" "}
              {formatDistanceToNow(new Date(latestDeployedAt), { addSuffix: true, locale: dateLocale })}
            </p>
          )}
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[160px] w-full">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} minTickGap={24} />
                <YAxis axisLine={false} tickLine={false} width={36} tick={{ fontSize: 11 }} unit="s" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="buildSeconds"
                  stroke="var(--color-buildSeconds)"
                  fill="var(--color-buildSeconds)"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          ) : (
            <p className="text-muted-foreground py-6 text-center text-sm">{t("monitoring.noData")}</p>
          )}
        </>
      )}
    </ServiceStatusCard>
  )
}
