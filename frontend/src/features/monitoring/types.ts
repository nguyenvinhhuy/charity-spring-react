export type RenderState = "LIVE" | "SUSPENDED" | "ERROR" | "NOT_CONFIGURED"
export type VercelState = "READY" | "BUILDING" | "ERROR" | "NOT_CONFIGURED"

/** Time window for the Render/Vercel trend charts — shared by both, selected once for the whole page. */
export type MetricRange = "ONE_DAY" | "SEVEN_DAYS" | "ONE_MONTH" | "ALL"

/** Generic 4-state status used for badge coloring, derived from each service's own state/usage. */
export type SystemStatus = "OK" | "DEGRADED" | "ERROR" | "NOT_CONFIGURED"

export interface MetricPoint {
  timestamp: string
  value: number
}

export interface DeployDurationPoint {
  deployedAt: string
  buildSeconds: number
  state: VercelState
}

export interface CategoryAmount {
  label: string
  bytes: number
}

export interface RenderStatus {
  configured: boolean
  status: RenderState
  lastDeployStatus: string | null
  lastDeployAt: string | null
  serviceUrl: string | null
  cpuSeries: MetricPoint[]
  memorySeries: MetricPoint[]
  errorMessage: string | null
}

export interface VercelStatus {
  configured: boolean
  status: VercelState
  deploymentUrl: string | null
  recentBuilds: DeployDurationPoint[]
  errorMessage: string | null
}

export interface DatabaseStatus {
  databaseSizeBytes: number
  databaseLimitBytes: number
  activeConnections: number
  topTables: CategoryAmount[]
  errorMessage: string | null
}

export interface CloudinaryStatus {
  configured: boolean
  storageUsedBytes: number
  storageLimitBytes: number
  bandwidthUsedBytes: number
  byResourceType: CategoryAmount[]
  errorMessage: string | null
}

export interface MonitoringOverview {
  render: RenderStatus
  vercel: VercelStatus
  database: DatabaseStatus
  cloudinary: CloudinaryStatus
  fetchedAt: string
}
