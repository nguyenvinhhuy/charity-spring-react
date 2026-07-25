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

// Types used by the example calendar UI (sample data)
export interface CalendarEvent {
  id: number
  title: string
  date: Date
  time?: string
  duration?: string
  type: "meeting" | "event" | "personal" | "task" | "reminder"
  attendees: string[]
  location?: string
  color?: string
  description?: string
}

export interface Calendar {
  id: string
  name: string
  color?: string
  visible?: boolean
  type?: "personal" | "work" | "shared"
}
