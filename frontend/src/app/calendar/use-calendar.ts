"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { listCampaigns } from "@/api/campaigns"
import { createEvent, deleteEvent, listEvents, updateEvent } from "@/api/events"
import { getErrorMessage } from "@/api/axios"
import type { CreateEventRequest } from "@/types/event"
import type { CalendarItem, EventCalendarItem } from "./types"

const FETCH_SIZE = 100

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
  handleSaveEvent: (payload: CreateEventRequest) => Promise<void>
  handleDeleteEvent: (id: number) => Promise<void>
}

/**
 * Loads campaign activity dates and standalone internal events, merging both into one calendar item
 * list, and exposes the create/edit/delete actions for internal events (campaigns are read-only here).
 */
export function useCalendar(): UseCalendarReturn {
  const { t } = useTranslation()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showCalendarSheet, setShowCalendarSheet] = useState(false)
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventCalendarItem | null>(null)
  const [items, setItems] = useState<CalendarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const hasLoadedOnce = useRef(false)

  /**
   * Fetches campaigns and events, merging those with activity dates into a single item list.
   * Only shows the full-page loading state on the first fetch — later refreshes (after a save or
   * delete) update `items` in place so the calendar's current month/view is not remounted.
   */
  const load = useCallback(async () => {
    if (!hasLoadedOnce.current) setLoading(true)
    try {
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

      setItems([...campaignItems, ...eventItems])
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      hasLoadedOnce.current = true
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date)
    setShowCalendarSheet(false)
  }, [])

  const handleNewEvent = useCallback(() => {
    setEditingEvent(null)
    setShowEventForm(true)
  }, [])

  const handleEditEvent = useCallback((item: EventCalendarItem) => {
    setEditingEvent(item)
    setShowEventForm(true)
  }, [])

  /** Creates or updates the internal event being edited, then refreshes the calendar. */
  const handleSaveEvent = useCallback(
    async (payload: CreateEventRequest) => {
      setSaving(true)
      try {
        if (editingEvent) {
          await updateEvent(editingEvent.id, payload)
          toast.success(t("calendar.eventUpdated"))
        } else {
          await createEvent(payload)
          toast.success(t("calendar.eventCreated"))
        }
        setShowEventForm(false)
        setEditingEvent(null)
        await load()
      } catch (err) {
        toast.error(getErrorMessage(err))
      } finally {
        setSaving(false)
      }
    },
    [editingEvent, load, t],
  )

  /** Deletes an internal event, then refreshes the calendar. */
  const handleDeleteEvent = useCallback(
    async (id: number) => {
      setSaving(true)
      try {
        await deleteEvent(id)
        toast.success(t("calendar.eventDeleted"))
        setShowEventForm(false)
        setEditingEvent(null)
        await load()
      } catch (err) {
        toast.error(getErrorMessage(err))
      } finally {
        setSaving(false)
      }
    },
    [load, t],
  )

  return {
    selectedDate,
    showCalendarSheet,
    showEventForm,
    editingEvent,
    items,
    loading,
    saving,
    setShowCalendarSheet,
    setShowEventForm,
    handleDateSelect,
    handleNewEvent,
    handleEditEvent,
    handleSaveEvent,
    handleDeleteEvent,
  }
}
