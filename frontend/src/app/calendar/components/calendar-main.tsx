"use client"

import { useMemo, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  MapPin,
  Search,
  Grid3X3,
  List,
  ChevronDown,
  Menu,
} from "lucide-react"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
} from "date-fns"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { categoryLabel, localized, statusLabel, STATUS_VARIANTS } from "@/app/campaigns/components/campaign-constants"
import type { CampaignCategory } from "@/types"
import type { CalendarItem, EventCalendarItem } from "../types"
import { itemsForDay } from "../lib"

const CATEGORY_COLORS: Record<CampaignCategory, string> = {
  CHILDREN: "bg-pink-500",
  EDUCATION: "bg-blue-500",
  HEALTHCARE: "bg-red-500",
  DISASTER_RELIEF: "bg-orange-500",
  ELDERLY: "bg-purple-500",
  ENVIRONMENT: "bg-green-500",
  OTHER: "bg-slate-500",
}
const EVENT_COLOR = "bg-teal-500"

interface CalendarMainProps {
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  onMenuClick?: () => void
  items: CalendarItem[]
  onEditEvent: (item: EventCalendarItem) => void
  onDeleteEvent: (id: number) => void
}

/** Returns the Tailwind background color class used for an item's pill/dot. */
function colorFor(item: CalendarItem): string {
  return item.kind === "campaign" ? CATEGORY_COLORS[item.category] : EVENT_COLOR
}

/**
 * Renders the month/list calendar view for campaign activities and internal events.
 *
 * @param selectedDate the currently selected day
 * @param onDateSelect invoked when a day cell is clicked
 * @param onMenuClick invoked to open the mobile sidebar sheet
 * @param items the merged campaign and event items to display
 * @param onEditEvent invoked to open the edit dialog for an internal event
 * @param onDeleteEvent invoked to delete an internal event
 */
export function CalendarMain({
  selectedDate,
  onDateSelect,
  onMenuClick,
  items,
  onEditEvent,
  onDeleteEvent,
}: CalendarMainProps) {
  const { t, i18n } = useTranslation()
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date())
  const [viewMode, setViewMode] = useState<"month" | "list">("month")
  const [search, setSearch] = useState("")
  const [detailItem, setDetailItem] = useState<CalendarItem | null>(null)

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return items
    return items.filter((item) =>
      localized(i18n.language, item.title, item.titleEn).toLowerCase().includes(term),
    )
  }, [items, search, i18n.language])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = new Date(monthStart)
  calendarStart.setDate(calendarStart.getDate() - monthStart.getDay())
  const calendarEnd = new Date(monthEnd)
  calendarEnd.setDate(calendarEnd.getDate() + (6 - monthEnd.getDay()))
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  /** Navigates the visible month forward or backward. */
  function navigateMonth(direction: "prev" | "next") {
    setCurrentDate(direction === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
  }

  const renderCalendarGrid = () => {
    const weekDays = [
      t("calendar.weekday.sun"),
      t("calendar.weekday.mon"),
      t("calendar.weekday.tue"),
      t("calendar.weekday.wed"),
      t("calendar.weekday.thu"),
      t("calendar.weekday.fri"),
      t("calendar.weekday.sat"),
    ]

    return (
      <div className="flex-1 bg-background">
        <div className="grid grid-cols-7 border-b">
          {weekDays.map((day) => (
            <div key={day} className="p-4 text-center font-medium text-sm text-muted-foreground border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 flex-1">
          {calendarDays.map((day) => {
            const dayItems = itemsForDay(visibleItems, day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isDayToday = isToday(day)
            const isSelected = selectedDate && isSameDay(day, selectedDate)

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors",
                  isCurrentMonth ? "bg-background hover:bg-accent/50" : "bg-muted/30 text-muted-foreground",
                  isSelected && "ring-2 ring-primary ring-inset",
                  isDayToday && "bg-accent/20",
                )}
                onClick={() => onDateSelect?.(day)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isDayToday && "bg-primary text-primary-foreground rounded-md w-6 h-6 flex items-center justify-center text-xs",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {dayItems.length > 2 && (
                    <span className="text-xs text-muted-foreground">+{dayItems.length - 2}</span>
                  )}
                </div>

                <div className="space-y-1">
                  {dayItems.slice(0, 2).map((item) => (
                    <div
                      key={`${item.kind}-${item.id}`}
                      className={cn("text-xs p-1 rounded-sm text-white cursor-pointer truncate", colorFor(item))}
                      onClick={(e) => {
                        e.stopPropagation()
                        setDetailItem(item)
                      }}
                    >
                      <span className="truncate">{localized(i18n.language, item.title, item.titleEn)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderListView = () => {
    const upcoming = visibleItems
      .filter((item) => item.eventEndDate >= new Date())
      .sort((a, b) => a.eventStartDate.getTime() - b.eventStartDate.getTime())

    return (
      <div className="flex-1 p-6">
        <div className="space-y-4">
          {upcoming.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-10">{t("calendar.noUpcomingEvents")}</p>
          )}
          {upcoming.map((item) => (
            <Card
              key={`${item.kind}-${item.id}`}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setDetailItem(item)}
            >
              <CardContent className="px-4">
                <div className="flex items-start gap-3">
                  <div className={cn("w-3 h-3 rounded-full mt-1.5", colorFor(item))} />
                  <div className="flex-1">
                    <h3 className="font-medium">{localized(i18n.language, item.title, item.titleEn)}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center flex-wrap gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        {format(item.eventStartDate, "dd/MM/yyyy")}
                        {!isSameDay(item.eventStartDate, item.eventEndDate) &&
                          ` – ${format(item.eventEndDate, "dd/MM/yyyy")}`}
                      </div>
                      {item.kind === "event" && item.location && (
                        <div className="flex items-center flex-wrap gap-1">
                          <MapPin className="w-4 h-4" />
                          {item.location}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={item.kind === "campaign" ? STATUS_VARIANTS[item.status] : "outline"}>
                    {item.kind === "campaign" ? statusLabel(t, item.status) : t("calendar.eventBadge")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col flex-wrap gap-4 p-6 border-b md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <Button variant="outline" size="sm" className="xl:hidden cursor-pointer" onClick={onMenuClick}>
            <Menu className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")} className="cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")} className="cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="cursor-pointer">
              {t("calendar.today")}
            </Button>
          </div>

          <h1 className="text-2xl font-semibold">{format(currentDate, "MMMM yyyy")}</h1>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("calendar.searchPlaceholder")}
              className="pl-10 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="cursor-pointer">
                {viewMode === "month" && <Grid3X3 className="w-4 h-4 mr-2" />}
                {viewMode === "list" && <List className="w-4 h-4 mr-2" />}
                {viewMode === "month" ? t("calendar.viewMonth") : t("calendar.viewList")}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setViewMode("month")} className="cursor-pointer">
                <Grid3X3 className="w-4 h-4 mr-2" />
                {t("calendar.viewMonth")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode("list")} className="cursor-pointer">
                <List className="w-4 h-4 mr-2" />
                {t("calendar.viewList")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {viewMode === "month" ? renderCalendarGrid() : renderListView()}

      <Dialog open={detailItem !== null} onOpenChange={(open) => !open && setDetailItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {detailItem ? localized(i18n.language, detailItem.title, detailItem.titleEn) : ""}
            </DialogTitle>
            <DialogDescription>
              {detailItem?.kind === "campaign"
                ? t("calendar.campaignDateDescription")
                : t("calendar.internalEventDescription")}
            </DialogDescription>
          </DialogHeader>
          {detailItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                <span>
                  {format(detailItem.eventStartDate, "dd/MM/yyyy")}
                  {!isSameDay(detailItem.eventStartDate, detailItem.eventEndDate) &&
                    ` – ${format(detailItem.eventEndDate, "dd/MM/yyyy")}`}
                </span>
              </div>

              {detailItem.kind === "campaign" ? (
                <>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{categoryLabel(t, detailItem.category)}</Badge>
                    <Badge variant={STATUS_VARIANTS[detailItem.status]}>{statusLabel(t, detailItem.status)}</Badge>
                  </div>
                  <Button asChild className="w-full">
                    <Link to="/dashboard/campaigns" onClick={() => setDetailItem(null)}>
                      {t("calendar.viewInCampaignManagement")}
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  {detailItem.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{detailItem.location}</span>
                    </div>
                  )}
                  {(detailItem.description || detailItem.descriptionEn) && (
                    <p className="text-sm text-muted-foreground">
                      {localized(i18n.language, detailItem.description ?? "", detailItem.descriptionEn)}
                    </p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        onEditEvent(detailItem)
                        setDetailItem(null)
                      }}
                    >
                      {t("calendar.edit")}
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        onDeleteEvent(detailItem.id)
                        setDetailItem(null)
                      }}
                    >
                      {t("calendar.delete")}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
