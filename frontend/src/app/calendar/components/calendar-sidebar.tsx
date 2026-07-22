"use client"

import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"

import { DatePicker } from "./date-picker"
import { Button } from "@/components/ui/button"

interface CalendarSidebarProps {
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  onNewEvent?: () => void
  events?: Array<{ date: Date; count: number }>
  className?: string
}

/**
 * Renders the calendar's side panel: a button to add a new internal activity and a mini date picker.
 *
 * @param selectedDate the currently selected day
 * @param onDateSelect invoked when a day is picked
 * @param onNewEvent invoked when the "add activity" button is pressed
 * @param events dot-marker data for days that have at least one item
 * @param className additional classes applied to the panel container
 */
export function CalendarSidebar({
  selectedDate,
  onDateSelect,
  onNewEvent,
  events = [],
  className,
}: CalendarSidebarProps) {
  const { t } = useTranslation()
  return (
    <div className={`flex flex-col h-full bg-background rounded-lg ${className}`}>
      <div className="p-6 border-b">
        <Button className="w-full cursor-pointer" onClick={onNewEvent}>
          <Plus className="w-4 h-4 mr-2" />
          {t("calendar.addEventSidebarButton")}
        </Button>
      </div>

      <DatePicker selectedDate={selectedDate} onDateSelect={onDateSelect} events={events} />
    </div>
  )
}
