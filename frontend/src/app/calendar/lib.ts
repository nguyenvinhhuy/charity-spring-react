import { isWithinInterval, startOfDay } from "date-fns"
import type { CalendarItem } from "./types"

/**
 * Returns the calendar items whose date range includes the given day.
 *
 * @param items all calendar items (campaign activities and internal events)
 * @param day the day to match against
 */
export function itemsForDay(items: CalendarItem[], day: Date): CalendarItem[] {
  const target = startOfDay(day)
  return items.filter((item) =>
    isWithinInterval(target, { start: startOfDay(item.eventStartDate), end: startOfDay(item.eventEndDate) }),
  )
}

/**
 * Derives one dot-marker entry per day covered by any item, for the mini date-picker.
 *
 * @param items all calendar items (campaign activities and internal events)
 */
export function eventDatesFrom(items: CalendarItem[]): Array<{ date: Date; count: number }> {
  const counts = new Map<string, { date: Date; count: number }>()
  for (const item of items) {
    let cursor = startOfDay(item.eventStartDate)
    const end = startOfDay(item.eventEndDate)
    while (cursor <= end) {
      const key = cursor.toDateString()
      const existing = counts.get(key)
      counts.set(key, { date: cursor, count: (existing?.count ?? 0) + 1 })
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)
    }
  }
  return Array.from(counts.values())
}
