"use client"

import { Pie, PieChart } from "recharts"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import type { RoleCount } from "@/types/dashboard"
import { CHART_COLORS, ROLE_ORDER } from "./dashboard-constants"

interface MembersDonutProps {
  items: RoleCount[]
}

/**
 * Renders a donut chart of member counts by role with a labelled legend.
 *
 * @param items the member counts grouped by role
 */
export function MembersDonut({ items }: MembersDonutProps) {
  const { t } = useTranslation()

  // Show roles highest-privilege first (Admin → Contributor → Member), not raw query order.
  const data = [...items]
    .sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role])
    .map((item, index) => ({
      key: item.role,
      label: t(`role.${item.role}`),
      count: item.count,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }))

  const chartConfig: ChartConfig = {
    count: { label: t("dashboard.membersDonut.countLabel") },
    ...Object.fromEntries(data.map((d) => [d.key, { label: d.label, color: d.fill }])),
  }

  return (
    <Card className="self-start">
      <CardHeader>
        <CardTitle>{t("dashboard.membersDonut.title")}</CardTitle>
        <CardDescription>{t("dashboard.membersDonut.description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {data.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center text-sm">{t("dashboard.noData")}</p>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <ChartContainer config={chartConfig} className="h-[150px] w-[150px] shrink-0">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      nameKey="key"
                      formatter={(value) =>
                        t("dashboard.membersDonut.count", {
                          count: Number(value).toLocaleString("vi-VN"),
                        })
                      }
                    />
                  }
                />
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="key"
                  innerRadius={40}
                  outerRadius={70}
                  strokeWidth={4}
                  isAnimationActive={false}
                />
              </PieChart>
            </ChartContainer>
            <ul className="flex flex-1 flex-col gap-2 self-stretch">
              {data.map((item) => (
                <li key={item.key} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="size-3 shrink-0 rounded-[2px]" style={{ backgroundColor: item.fill }} />
                    {item.label}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {t("dashboard.membersDonut.count", { count: item.count.toLocaleString("vi-VN") })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
