"use client"

import { useTranslation } from "react-i18next"
import { Image as ImageIcon } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { formatBytes, usageBarColorClass, usagePercent } from "../lib"
import { ServiceStatusCard } from "./service-status-card"
import type { CloudinaryStatus, SystemStatus } from "../types"

interface CloudinaryStatusCardProps {
  status: CloudinaryStatus
  thresholdPercent: number
}

/** Monitoring card for Cloudinary storage: usage bar vs. free-tier limit, matching the Database card's layout. */
export function CloudinaryStatusCard({ status, thresholdPercent }: CloudinaryStatusCardProps) {
  const { t } = useTranslation()
  const percent = usagePercent(status.storageUsedBytes, status.storageLimitBytes)
  const systemStatus: SystemStatus = !status.configured
    ? "NOT_CONFIGURED"
    : status.errorMessage
      ? "ERROR"
      : percent >= thresholdPercent
        ? "DEGRADED"
        : "OK"

  return (
    <ServiceStatusCard
      icon={<ImageIcon className="text-muted-foreground size-5" />}
      title={t("monitoring.cloudinary.title")}
      description={t("monitoring.cloudinary.description")}
      status={systemStatus}
      statusLabel={t(`monitoring.status.${systemStatus}`)}
    >
      {status.errorMessage ? (
        <p className="text-destructive text-sm">{status.errorMessage}</p>
      ) : !status.configured ? (
        <p className="text-muted-foreground text-sm">{t("monitoring.notConfigured")}</p>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <Progress value={percent} indicatorClassName={usageBarColorClass(percent, thresholdPercent)} />
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span>
                {formatBytes(status.storageUsedBytes)} / {formatBytes(status.storageLimitBytes)}
              </span>
              <span>{percent}%</span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            {t("monitoring.cloudinary.bandwidth", { used: formatBytes(status.bandwidthUsedBytes) })}
          </p>
        </>
      )}
    </ServiceStatusCard>
  )
}
