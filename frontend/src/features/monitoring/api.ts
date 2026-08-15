import { api } from "@/api/axios"
import type { MetricRange, MonitoringOverview } from "./types"

/**
 * Fetches the current status of Render, the database, and Cloudinary (ADMIN only).
 *
 * @param range the time window for the Render trend chart
 */
export async function getMonitoringOverview(range: MetricRange): Promise<MonitoringOverview> {
  const { data } = await api.get<MonitoringOverview>("/monitoring/overview", { params: { range } })
  return data
}
