import { api } from "@/api/axios"
import type { MetricRange, MonitoringOverview } from "./types"

/**
 * Fetches the current status of Render, Vercel, the database, and Cloudinary (ADMIN only).
 *
 * @param range the time window for the Render/Vercel trend charts
 */
export async function getMonitoringOverview(range: MetricRange): Promise<MonitoringOverview> {
  const { data } = await api.get<MonitoringOverview>("/monitoring/overview", { params: { range } })
  return data
}
