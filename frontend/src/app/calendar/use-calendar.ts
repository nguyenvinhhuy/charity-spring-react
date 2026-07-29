"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { listCampaigns } from "@/api/campaigns"
import { createEvent, deleteEvent, listEvents, updateEvent } from "@/api/events"
import { getErrorMessage } from "@/api/axios"
import type { CreateEventRequest } from "@/types/event"
import type { CalendarItem, EventCalendarItem } from "./types"

const FETCH_SIZE = 100
const CALENDAR_ITEMS_QUERY_KEY = ["calendar-items"]

export interface UseCalendarReturn {
  selectedDate: Date
  showCalendarSheet: boolean
  showEventForm: boolean
  editingEvent: EventCalendarItem | null
  items: CalendarItem[]
  loading: boolean
  saving: boolean
  setShowCalendarSheet: (show: boolean) => void
  setShowEventForm: (show: boolean) => void
  handleDateSelect: (date: Date) => void
  handleNewEvent: () => void
  handleEditEvent: (item: EventCalendarItem) => void
  handleSaveEvent: (payload: CreateEventRequest) => void
  handleDeleteEvent: (id: number) => void
}

/** Fetches campaigns and events, merging those with activity dates into a single calendar item list. */
async function fetchCalendarItems(): Promise<CalendarItem[]> {
  const [campaignsPage, eventsPage] = await Promise.all([
    listCampaigns({ size: FETCH_SIZE }),
    listEvents({ size: FETCH_SIZE }),
  ])

  const campaignItems: CalendarItem[] = campaignsPage.content
    .filter((c) => c.eventStartDate)
    .map((c) => ({
      kind: "campaign",
      id: c.id,
      title: c.title,
      titleEn: c.titleEn,
      eventStartDate: new Date(c.eventStartDate as string),
      eventEndDate: new Date(c.eventEndDate ?? (c.eventStartDate as string)),
      category: c.category,
      status: c.status,
    }))

  const eventItems: CalendarItem[] = eventsPage.content.map((e) => ({
    kind: "event",
    id: e.id,
    title: e.title,
    titleEn: e.titleEn,
    eventStartDate: new Date(e.eventStartDate),
    eventEndDate: new Date(e.eventEndDate ?? e.eventStartDate),
    description: e.description,
    descriptionEn: e.descriptionEn,
    location: e.location,
  }))

  return [...campaignItems, ...eventItems]
}

/**
 * Loads campaign activity dates and standalone internal events, merging both into one calendar item
 * list, and exposes the create/edit/delete actions for internal events (campaigns are read-only here).
 */
export function useCalendar(): UseCalendarReturn {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showCalendarSheet, setShowCalendarSheet] = useState(false)
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventCalendarItem | null>(null)

  const { data: items = [], isLoading: loading } = useQuery({
    queryKey: CALENDAR_ITEMS_QUERY_KEY,
    queryFn: fetchCalendarItems,
  })

  function handleDateSelect(date: Date) {
    setSelectedDate(date)
    setShowCalendarSheet(false)
  }

  function handleNewEvent() {
    setEditingEvent(null)
    setShowEventForm(true)
  }

  function handleEditEvent(item: EventCalendarItem) {
    setEditingEvent(item)
    setShowEventForm(true)
  }

  const saveMutation = useMutation({
    mutationFn: (payload: CreateEventRequest) =>
      editingEvent ? updateEvent(editingEvent.id, payload) : createEvent(payload),
    // Awaits the refetch before closing so the calendar behind it never briefly shows stale data.
    onSuccess: async () => {
      toast.success(editingEvent ? t("calendar.eventUpdated") : t("calendar.eventCreated"))
      await queryClient.invalidateQueries({ queryKey: CALENDAR_ITEMS_QUERY_KEY })
      setShowEventForm(false)
      setEditingEvent(null)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteEvent(id),
    onSuccess: async () => {
      toast.success(t("calendar.eventDeleted"))
      await queryClient.invalidateQueries({ queryKey: CALENDAR_ITEMS_QUERY_KEY })
      setShowEventForm(false)
      setEditingEvent(null)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  /** Creates or updates the internal event being edited, then refreshes the calendar. */
  function handleSaveEvent(payload: CreateEventRequest) {
    saveMutation.mutate(payload)
  }

  /** Deletes an internal event, then refreshes the calendar. */
  function handleDeleteEvent(id: number) {
    deleteMutation.mutate(id)
  }

  return {
    selectedDate,
    showCalendarSheet,
    showEventForm,
    editingEvent,
    items,
    loading,
    saving: saveMutation.isPending || deleteMutation.isPending,
    setShowCalendarSheet,
    setShowEventForm,
    handleDateSelect,
    handleNewEvent,
    handleEditEvent,
    handleSaveEvent,
    handleDeleteEvent,
  }
}
