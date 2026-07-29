// ---- Internal activities (non-fundraising events) ----

export interface Event {
  id: number
  title: string
  titleEn: string | null
  description: string | null
  descriptionEn: string | null
  eventStartDate: string
  eventEndDate: string | null
  location: string | null
  createdBy: number | null
  createdAt: string
  updatedAt: string
}

export interface CreateEventRequest {
  title: string
  titleEn: string | null
  description: string | null
  descriptionEn: string | null
  eventStartDate: string
  eventEndDate: string | null
  location: string | null
}

export type UpdateEventRequest = CreateEventRequest
