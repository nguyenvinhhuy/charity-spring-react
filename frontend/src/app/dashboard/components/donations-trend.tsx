"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { DonationPoint, Granularity } from "@/types"
import { formatVnd } from "@/app/campaigns/components/campaign-constants"
import { compactVnd } from "./dashboard-constants"

interface DonationsTrendProps {
  data: DonationPoint[]
  granularity: Granularity
  onGranularityChange: (granularity: Granularity) => void
}

/**
 * Renders an area chart of the donation series with a selector to switch the bucketing granularity.
 *
 * @param data the chronological donation series
 * @param granularity the current bucketing granularity
 * @param onGranularityChange invoked with the newly selected granularity
 */
export function DonationsTrend({ data, granularity, onGranularityChange }: DonationsTrendProps) {
  const { t } = useTranslation()

  const granularityOptions: Granularity[] = ["MONTH", "QUARTER", "YEAR"]

  const chartConfig = {
    amount: {
      label: t("dashboard.donationsTrend.amountLabel"),
      color: "var(--primary)",
    },
  } satisfies ChartConfig

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>{t("dashboard.donationsTrend.title")}</CardTitle>
          <CardDescription>{t("dashboard.donationsTrend.description")}</CardDescription>
        </div>
        <Select
          value={granularity}
          onValueChange={(value) => onGranularityChange(value as Granularity)}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {granularityOptions.map((g) => (
              <SelectItem key={g} value={g}>
                {t(`dashboard.granularity.${g}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-0 pt-4">
        <div className="px-6 pb-6">
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-amount)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--color-amount)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis
                dataKey="period"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={56}
                tick={{ fontSize: 12 }}
                tickFormatter={(value: number) => compactVnd(value)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, _name, item) => {
                      const point = item.payload as DonationPoint
                      return (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-foreground font-medium">
                            {formatVnd(Number(value))}
                          </span>
                          <span className="text-muted-foreground">
                            {t("dashboard.donationsTrend.tooltipCount", {
                              count: point.count.toLocaleString("vi-VN"),
                            })}
                          </span>
                        </div>
                      )
                    }}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="var(--color-amount)"
                fill="url(#colorAmount)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
