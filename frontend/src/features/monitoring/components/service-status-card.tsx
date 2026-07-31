"use client"

import type { ReactNode } from "react"
import { Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { SYSTEM_STATUS_BADGE_CLASSES } from "@/lib/status-badges"
import type { SystemStatus } from "../types"

interface ServiceStatusCardProps {
  icon: ReactNode
  title: string
  description: string
  status: SystemStatus
  statusLabel: string
  /** Extra context shown behind an info icon next to the title, for cards with a longer explanation. */
  infoTooltip?: string
  children: ReactNode
}

/** Shared shell for a monitoring service card: icon + title + status badge, with a content slot below. */
export function ServiceStatusCard({
  icon,
  title,
  description,
  status,
  statusLabel,
  infoTooltip,
  children,
}: ServiceStatusCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <div className="flex items-center gap-1.5">
              <CardTitle>{title}</CardTitle>
              {infoTooltip && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-label={infoTooltip} className="text-muted-foreground cursor-pointer">
                      <Info className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">{infoTooltip}</TooltipContent>
                </Tooltip>
              )}
            </div>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
        <Badge className={SYSTEM_STATUS_BADGE_CLASSES[status]}>{statusLabel}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  )
}
