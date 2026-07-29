"use client"

import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SYSTEM_STATUS_BADGE_CLASSES } from "@/lib/status-badges"
import type { SystemStatus } from "../types"

interface ServiceStatusCardProps {
  icon: ReactNode
  title: string
  description: string
  status: SystemStatus
  statusLabel: string
  children: ReactNode
}

/** Shared shell for a monitoring service card: icon + title + status badge, with a content slot below. */
export function ServiceStatusCard({ icon, title, description, status, statusLabel, children }: ServiceStatusCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
        <Badge className={SYSTEM_STATUS_BADGE_CLASSES[status]}>{statusLabel}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  )
}
