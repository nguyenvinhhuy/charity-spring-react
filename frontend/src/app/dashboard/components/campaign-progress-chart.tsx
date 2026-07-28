"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import type { CampaignProgressItem } from "@/types/dashboard"
import { localized } from "@/app/campaigns/components/campaign-constants"

interface CampaignProgressChartProps {
  items: CampaignProgressItem[]
}

const MAX_CAMPAIGNS = 8
const MAX_NAME_LENGTH = 22

/** Truncates a label to the maximum display length with an ellipsis. */
function truncate(value: string): string {
  return value.length > MAX_NAME_LENGTH ? `${value.slice(0, MAX_NAME_LENGTH)}…` : value
}

/**
 * Renders a single-line Y-axis tick for the campaign name, bypassing Recharts' own
 * `<Text>` component (which auto-wraps to multiple lines when the label doesn't fit
 * the axis width) — the full name is still available via the native title tooltip on hover.
 */
function CampaignNameTick({ x, y, payload }: { x: number; y: number; payload: { value: string } }) {
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fontSize={12} className="fill-muted-foreground">
      <title>{payload.value}</title>
      {truncate(payload.value)}
    </text>
  )
}

/**
 * Renders a horizontal bar chart of funding progress percentages for the top campaigns.
 *
 * @param items the campaign progress items, already sorted by current amount descending
 */
export function CampaignProgressChart({ items }: CampaignProgressChartProps) {
  const { t, i18n } = useTranslation()

  const chartConfig = {
    percent: {
      label: t("dashboard.campaignProgress.percentLabel"),
      color: "var(--primary)",
    },
  } satisfies ChartConfig

  const data = items.slice(0, MAX_CAMPAIGNS).map((item) => ({
    name: localized(i18n.language, item.title, item.titleEn),
    percent: item.percent,
  }))

  // Size the chart to the number of bars so it stays compact with few campaigns.
  const chartHeight = Math.max(120, data.length * 40)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.campaignProgress.title")}</CardTitle>
        <CardDescription>{t("dashboard.campaignProgress.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center text-sm">{t("dashboard.noData")}</p>
        ) : (
          <ChartContainer config={chartConfig} style={{ height: chartHeight }} className="w-full">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 24, left: 4, bottom: 4 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis
                type="number"
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(value: number) => `${value}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={150}
                axisLine={false}
                tickLine={false}
                tick={<CampaignNameTick x={0} y={0} payload={{ value: "" }} />}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent formatter={(value) => `${Number(value)}%`} />
                }
              />
              <Bar dataKey="percent" fill="var(--color-percent)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
