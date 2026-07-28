"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { CreateEventRequest } from "@/types/event"
import type { EventCalendarItem } from "../types"

interface EventFormValues {
  title: string
  titleEn: string
  description: string
  descriptionEn: string
  eventStartDate: string
  eventEndDate: string
  location: string
}

const EMPTY_VALUES: EventFormValues = {
  title: "",
  titleEn: "",
  description: "",
  descriptionEn: "",
  eventStartDate: "",
  eventEndDate: "",
  location: "",
}

interface EventFormProps {
  event?: EventCalendarItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (payload: CreateEventRequest) => void | Promise<void>
  onDelete?: (id: number) => void | Promise<void>
  saving?: boolean
}

/** Formats a Date as a yyyy-MM-dd string for a date input's value. */
function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * Dialog to create or edit a standalone internal activity (no fundraising component).
 *
 * @param event when set, the dialog edits this event; otherwise it creates a new one
 * @param open whether the dialog is visible
 * @param onOpenChange invoked when the dialog's open state should change
 * @param onSave invoked with the validated payload on submit
 * @param onDelete invoked with the event id when the delete button is pressed
 * @param saving whether a save/delete request is in flight
 */
export function EventForm({ event, open, onOpenChange, onSave, onDelete, saving }: EventFormProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState<EventFormValues>(EMPTY_VALUES)

  useEffect(() => {
    if (!open) return
    if (event) {
      setForm({
        title: event.title,
        titleEn: event.titleEn ?? "",
        description: event.description ?? "",
        descriptionEn: event.descriptionEn ?? "",
        eventStartDate: toDateInputValue(event.eventStartDate),
        eventEndDate: toDateInputValue(event.eventEndDate),
        location: event.location ?? "",
      })
    } else {
      setForm(EMPTY_VALUES)
    }
  }, [open, event])

  /** Validates the form and hands the payload to the parent for creation or update. */
  function handleSave() {
    if (!form.title.trim()) {
      toast.error(t("calendar.validationTitleRequired"))
      return
    }
    if (!form.eventStartDate) {
      toast.error(t("calendar.validationStartDateRequired"))
      return
    }
    void onSave({
      title: form.title.trim(),
      titleEn: form.titleEn.trim() || null,
      description: form.description.trim() || null,
      descriptionEn: form.descriptionEn.trim() || null,
      eventStartDate: form.eventStartDate,
      eventEndDate: form.eventEndDate || null,
      location: form.location.trim() || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{event ? t("calendar.editEventTitle") : t("calendar.addEventTitle")}</DialogTitle>
          <DialogDescription>{t("calendar.eventFormDescription")}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="vi">
          <TabsList className="w-full">
            <TabsTrigger value="vi">{t("calendar.tabVi")}</TabsTrigger>
            <TabsTrigger value="en">{t("calendar.tabEn")}</TabsTrigger>
          </TabsList>

          <TabsContent value="vi" className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t("calendar.titleLabel")}</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder={t("calendar.titlePlaceholder")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("calendar.descriptionLabel")}</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder={t("calendar.descriptionPlaceholder")}
              />
            </div>
          </TabsContent>

          <TabsContent value="en" className="mt-4 flex flex-col gap-4">
            <p className="text-muted-foreground text-xs">{t("calendar.enHint")}</p>
            <div className="flex flex-col gap-1.5">
              <Label>{t("calendar.titleLabel")}</Label>
              <Input
                value={form.titleEn}
                onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("calendar.descriptionLabel")}</Label>
              <Textarea
                rows={3}
                value={form.descriptionEn}
                onChange={(e) => setForm((f) => ({ ...f, descriptionEn: e.target.value }))}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t("calendar.startDate")}</Label>
            <Input
              type="date"
              value={form.eventStartDate}
              onChange={(e) => setForm((f) => ({ ...f, eventStartDate: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("calendar.endDate")}</Label>
            <Input
              type="date"
              value={form.eventEndDate}
              onChange={(e) => setForm((f) => ({ ...f, eventEndDate: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t("calendar.location")}</Label>
          <Input
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            placeholder={t("calendar.locationPlaceholder")}
          />
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <div>
            {event && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => onDelete(event.id)}
                disabled={saving}
              >
                {t("calendar.delete")}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("calendar.cancel")}
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? t("calendar.saving") : event ? t("calendar.saveChanges") : t("calendar.addEventButton")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
