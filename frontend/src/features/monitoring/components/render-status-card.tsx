"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { formatDistanceToNow } from "date-fns"
import { vi as viLocale, enUS } from "date-fns/locale"
import { useTranslation } from "react-i18next"
import { Server } from "lucide-react"
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
import type { MetricRange, RenderStatus, SystemStatus } from "../types"

interface RenderStatusCardProps {
  status: RenderStatus
  range: MetricRange
}

function toSystemStatus(status: RenderStatus["status"]): SystemStatus {
  switch (status) {
    case "LIVE":
      return "OK"
    case "SUSPENDED":
      return "DEGRADED"
    case "ERROR":
      return "ERROR"
    default:
      return "NOT_CONFIGURED"
  }
}

/** Monitoring card for the Render-hosted backend: status, last deploy, and a CPU/memory trend chart. */
export function RenderStatusCard({ status, range }: RenderStatusCardProps) {
  const { t, i18n } = useTranslation()
  const dateLocale = i18n.language === "vi" ? viLocale : enUS

  const chartConfig = {
    cpu: { label: t("monitoring.render.cpu"), color: CHART_COLORS[0] },
    memory: { label: t("monitoring.render.memory"), color: CHART_COLORS[1] },
  } satisfies ChartConfig

  const chartData = status.memorySeries.map((point, index) => ({
    time: formatChartTick(point.timestamp, range, i18n.language),
    cpu: status.cpuSeries[index]?.value ?? 0,
    memory: point.value,
  }))

  return (
    <ServiceStatusCard
      icon={<Server className="text-muted-foreground size-5" />}
      title={t("monitoring.render.title")}
      description={t("monitoring.render.description")}
      status={toSystemStatus(status.status)}
      statusLabel={t(`monitoring.status.${toSystemStatus(status.status)}`)}
      infoTooltip={t("monitoring.render.metricsNote")}
    >
      {status.errorMessage ? (
        <p className="text-destructive text-sm">{status.errorMessage}</p>
      ) : !status.configured ? (
        <p className="text-muted-foreground text-sm">{t("monitoring.notConfigured")}</p>
      ) : (
        <>
          {status.lastDeployStatus && (
            <p className="text-muted-foreground text-sm">
              {t("monitoring.render.lastDeploy", { status: status.lastDeployStatus })}
              {status.lastDeployAt &&
                ` · ${formatDistanceToNow(new Date(status.lastDeployAt), { addSuffix: true, locale: dateLocale })}`}
            </p>
          )}
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[360px] w-full">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} minTickGap={24} />
                {/* Fixed 0-100% domain, always — an auto-scaled axis would visually exaggerate low usage. */}
                <YAxis
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                  tick={{ fontSize: 11 }}
                  unit="%"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  stroke="var(--color-cpu)"
                  fill="var(--color-cpu)"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="memory"
                  stroke="var(--color-memory)"
                  fill="var(--color-memory)"
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
