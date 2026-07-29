import { api } from "@/api/axios"
import type { Page } from "@/types/common"
import type { CreateEventRequest, Event, UpdateEventRequest } from "@/types/event"

export interface ListEventsParams {
  page?: number
  size?: number
}

/**
 * List internal activities (non-fundraising events), ordered by start date.
 *
 * @param params pagination options
 */
export async function listEvents(params: ListEventsParams = {}): Promise<Page<Event>> {
  const { data } = await api.get<Page<Event>>("/events", { params })
  return data
}

/**
 * Create a new internal activity (admin/contributor).
 *
 * @param payload the event fields
 */
export async function createEvent(payload: CreateEventRequest): Promise<Event> {
  const { data } = await api.post<Event>("/events", payload)
  return data
}

/**
 * Update an existing internal activity by id.
 *
 * @param id event id
 * @param payload the updated event fields
 */
export async function updateEvent(id: number, payload: UpdateEventRequest): Promise<Event> {
  const { data } = await api.put<Event>(`/events/${id}`, payload)
  return data
}

/**
 * Delete an internal activity by id (admin only).
 *
 * @param id event id
 */
export async function deleteEvent(id: number): Promise<void> {
  await api.delete(`/events/${id}`)
}
