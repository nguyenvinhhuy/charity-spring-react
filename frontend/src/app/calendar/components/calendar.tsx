"use client"

import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { CalendarSidebar } from "./calendar-sidebar"
import { CalendarMain } from "./calendar-main"
import { EventForm } from "./event-form"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useCalendar } from "../use-calendar"
import { eventDatesFrom } from "../lib"

/** Renders the calendar page: campaign activity dates and internal events on a shared month/list view. */
export function Calendar() {
  const { t } = useTranslation()
  const calendar = useCalendar()
  const eventDates = useMemo(() => eventDatesFrom(calendar.items), [calendar.items])

  return (
    <>
      <div className="border rounded-lg bg-background relative">
        <div className="flex min-h-[800px]">
          {/* Desktop Sidebar - Hidden on mobile/tablet, shown on extra large screens */}
          <div className="hidden xl:block w-80 flex-shrink-0 border-r">
            <CalendarSidebar
              selectedDate={calendar.selectedDate}
              onDateSelect={calendar.handleDateSelect}
              onNewEvent={calendar.handleNewEvent}
              events={eventDates}
              className="h-full"
            />
          </div>

          {/* Main Calendar Panel */}
          <div className="flex-1 min-w-0">
            {calendar.loading ? (
              <div className="text-muted-foreground py-20 text-center text-sm">{t("calendar.loading")}</div>
            ) : (
              <CalendarMain
                selectedDate={calendar.selectedDate}
                onDateSelect={calendar.handleDateSelect}
                onMenuClick={() => calendar.setShowCalendarSheet(true)}
                items={calendar.items}
                onEditEvent={calendar.handleEditEvent}
                onDeleteEvent={calendar.handleDeleteEvent}
              />
            )}
          </div>
        </div>

        {/* Mobile/Tablet Sheet - Positioned relative to calendar container */}
        <Sheet open={calendar.showCalendarSheet} onOpenChange={calendar.setShowCalendarSheet}>
          <SheetContent side="left" className="w-80 p-0" style={{ position: "absolute" }}>
            <SheetHeader className="p-4 pb-2">
              <SheetTitle>{t("calendar.sheetTitle")}</SheetTitle>
              <SheetDescription>{t("calendar.sheetDescription")}</SheetDescription>
            </SheetHeader>
            <CalendarSidebar
              selectedDate={calendar.selectedDate}
              onDateSelect={calendar.handleDateSelect}
              onNewEvent={calendar.handleNewEvent}
              events={eventDates}
              className="h-full"
            />
          </SheetContent>
        </Sheet>
      </div>

      <EventForm
        event={calendar.editingEvent}
        open={calendar.showEventForm}
        onOpenChange={calendar.setShowEventForm}
        onSave={calendar.handleSaveEvent}
        onDelete={calendar.handleDeleteEvent}
        saving={calendar.saving}
      />
    </>
  )
}
