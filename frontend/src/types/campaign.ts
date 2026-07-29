export type CampaignStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "CLOSED" | "ARCHIVED"

export type CampaignCategory =
  "CHILDREN" | "EDUCATION" | "HEALTHCARE" | "DISASTER_RELIEF" | "ELDERLY" | "ENVIRONMENT" | "OTHER"

export interface PublicCampaignStats {
  totalRaised: number
  totalDonors: number
  activeCount: number
  completedCount: number
  totalCount: number
}

export interface CampaignSummary {
  id: number
  title: string
  slug: string
  summary: string | null
  titleEn: string | null
  summaryEn: string | null
  thumbnailUrl: string | null
  targetAmount: number
  currentAmount: number
  donorCount: number
  status: CampaignStatus
  category: CampaignCategory
  startDate: string
  endDate: string | null
  eventStartDate: string | null
  eventEndDate: string | null
}

export interface CampaignDetail extends CampaignSummary {
  description: string
  descriptionEn: string | null
  images: string[]
  bankAccountNo: string
  bankAccountName: string
  qrDescription: string | null
  thienNguyenUrl: string | null
  statementUrl: string | null
  viewCount: number
  capacity: number | null
  createdBy: number | null
  createdAt: string
  updatedAt: string
}

export interface CreateCampaignRequest {
  title: string
  summary: string | null
  description: string
  titleEn: string | null
  summaryEn: string | null
  descriptionEn: string | null
  category: CampaignCategory
  targetAmount: number
  thumbnailUrl: string | null
  images: string[]
  bankAccountNo: string
  bankAccountName: string
  qrDescription: string | null
  thienNguyenUrl: string | null
  statementUrl: string | null
  startDate: string
  endDate: string | null
  eventStartDate: string | null
  eventEndDate: string | null
  capacity: number | null
}

export type UpdateCampaignRequest = CreateCampaignRequest

export interface UpdateStatusRequest {
  status: CampaignStatus
}

export interface UpdateProgressRequest {
  currentAmount: number
  donorCount: number
}
