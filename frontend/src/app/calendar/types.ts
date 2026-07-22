import type { CampaignCategory, CampaignStatus } from "@/types"

export interface CampaignCalendarItem {
  kind: "campaign"
  id: number
  title: string
  titleEn: string | null
  eventStartDate: Date
  eventEndDate: Date
  category: CampaignCategory
  status: CampaignStatus
}

export interface EventCalendarItem {
  kind: "event"
  id: number
  title: string
  titleEn: string | null
  eventStartDate: Date
  eventEndDate: Date
  description: string | null
  descriptionEn: string | null
  location: string | null
}

export type CalendarItem = CampaignCalendarItem | EventCalendarItem
