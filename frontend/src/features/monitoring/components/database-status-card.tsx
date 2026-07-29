"use client"

import { Pie, PieChart } from "recharts"
import { useTranslation } from "react-i18next"
import { Database } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import { formatBytes, usageBarColorClass, usagePercent, USED_CATEGORY_COLORS } from "../lib"
import { ServiceStatusCard } from "./service-status-card"
import type { DatabaseStatus, SystemStatus } from "../types"

interface DatabaseStatusCardProps {
  status: DatabaseStatus
  thresholdPercent: number
}

/** Monitoring card for the Supabase/Postgres database: usage bar vs. free-tier limit + top-tables breakdown. */
export function DatabaseStatusCard({ status, thresholdPercent }: DatabaseStatusCardProps) {
  const { t } = useTranslation()
  const percent = usagePercent(status.databaseSizeBytes, status.databaseLimitBytes)
  const systemStatus: SystemStatus = status.errorMessage ? "ERROR" : percent >= thresholdPercent ? "DEGRADED" : "OK"

  const data = status.topTables.map((item, index) => ({
    key: item.label,
    label: item.label,
    bytes: item.bytes,
    fill: USED_CATEGORY_COLORS[index % USED_CATEGORY_COLORS.length],
  }))

  const chartConfig: ChartConfig = {
    bytes: { label: t("monitoring.bytesLabel") },
    ...Object.fromEntries(data.map((d) => [d.key, { label: d.label, color: d.fill }])),
  }

  return (
    <ServiceStatusCard
      icon={<Database className="text-muted-foreground size-5" />}
      title={t("monitoring.database.title")}
      description={t("monitoring.database.description")}
      status={systemStatus}
      statusLabel={t(`monitoring.status.${systemStatus}`)}
    >
      {status.errorMessage ? (
        <p className="text-destructive text-sm">{status.errorMessage}</p>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <Progress value={percent} indicatorClassName={usageBarColorClass(percent, thresholdPercent)} />
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span>
                {formatBytes(status.databaseSizeBytes)} / {formatBytes(status.databaseLimitBytes)}
              </span>
              <span>{percent}%</span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            {t("monitoring.database.connections", { count: status.activeConnections })}
          </p>
          {data.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">{t("monitoring.noData")}</p>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <ChartContainer config={chartConfig} className="mx-auto h-[140px] w-[140px] shrink-0">
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent nameKey="key" formatter={(value) => formatBytes(Number(value))} />}
                  />
                  <Pie
                    data={data}
                    dataKey="bytes"
                    nameKey="key"
                    innerRadius={40}
                    outerRadius={65}
                    strokeWidth={4}
                    isAnimationActive={false}
                  />
                </PieChart>
              </ChartContainer>
              <ul className="flex flex-1 flex-col gap-2">
                {data.map((item) => (
                  <li key={item.key} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2 truncate">
                      <span className="size-3 shrink-0 rounded-[2px]" style={{ backgroundColor: item.fill }} />
                      <span className="truncate">{item.label}</span>
                    </span>
                    <span className="text-muted-foreground shrink-0 tabular-nums">{formatBytes(item.bytes)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </ServiceStatusCard>
  )
}
