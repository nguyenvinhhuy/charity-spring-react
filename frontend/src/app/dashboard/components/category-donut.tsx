"use client"

import { Pie, PieChart } from "recharts"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import type { CategoryAmount } from "@/types"
import { categoryLabel, formatVnd } from "@/app/campaigns/components/campaign-constants"
import { CHART_COLORS } from "./dashboard-constants"

interface CategoryDonutProps {
  items: CategoryAmount[]
}

/**
 * Renders a donut chart of donation amounts by campaign category with a labelled legend.
 *
 * @param items the donation totals grouped by category
 */
export function CategoryDonut({ items }: CategoryDonutProps) {
  const { t } = useTranslation()

  const data = items.map((item, index) => ({
    key: item.category,
    label: categoryLabel(t, item.category),
    amount: item.amount,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }))

  const chartConfig: ChartConfig = {
    amount: { label: t("dashboard.categoryDonut.amountLabel") },
    ...Object.fromEntries(
      data.map((d) => [d.key, { label: d.label, color: d.fill }]),
    ),
  }

  return (
    <Card className="self-start">
      <CardHeader>
        <CardTitle>{t("dashboard.categoryDonut.title")}</CardTitle>
        <CardDescription>{t("dashboard.categoryDonut.description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {data.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center text-sm">{t("dashboard.noData")}</p>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="mx-auto h-[180px] w-[180px]">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      nameKey="key"
                      formatter={(value) => formatVnd(Number(value))}
                    />
                  }
                />
                <Pie
                  data={data}
                  dataKey="amount"
                  nameKey="key"
                  innerRadius={50}
                  outerRadius={85}
                  strokeWidth={4}
                  isAnimationActive={false}
                />
              </PieChart>
            </ChartContainer>
            <ul className="flex flex-col gap-2">
              {data.map((item) => (
                <li key={item.key} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className="size-3 shrink-0 rounded-[2px]"
                      style={{ backgroundColor: item.fill }}
                    />
                    {item.label}
                  </span>
                  <span className="text-muted-foreground tabular-nums">{formatVnd(item.amount)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  )
}
