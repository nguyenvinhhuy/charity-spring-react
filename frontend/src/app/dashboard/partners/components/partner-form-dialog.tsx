"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { createPartner, updatePartner } from "@/api/partners"
import { getErrorMessage } from "@/api/axios"
import type { CreatePartnerRequest, Partner } from "@/types/partner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageUploadField } from "@/components/image-upload-field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface PartnerFormValues {
  name: string
  logoUrl: string
  websiteUrl: string
  displayOrder: string
}

const EMPTY_VALUES: PartnerFormValues = {
  name: "",
  logoUrl: "",
  websiteUrl: "",
  displayOrder: "",
}

/** Maps a fetched partner into the flat form values. */
function partnerToValues(partner: Partner): PartnerFormValues {
  return {
    name: partner.name,
    logoUrl: partner.logoUrl,
    websiteUrl: partner.websiteUrl ?? "",
    displayOrder: partner.displayOrder != null ? String(partner.displayOrder) : "",
  }
}

/** Turns an empty string into null, keeping non-empty strings as-is. */
function orNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

interface PartnerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the dialog edits this partner; otherwise it creates a new one. */
  partner?: Partner | null
  onSaved: () => void
}

/**
 * Dialog form for creating a new partner (co-organizing unit) or editing an existing one.
 *
 * @param open whether the dialog is visible
 * @param onOpenChange invoked when the dialog's open state should change
 * @param partner when set, the dialog edits this partner; otherwise it creates a new one
 * @param onSaved invoked after a successful create or update
 */
export function PartnerFormDialog({ open, onOpenChange, partner, onSaved }: PartnerFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = Boolean(partner)
  const [values, setValues] = useState<PartnerFormValues>(EMPTY_VALUES)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setValues(partner ? partnerToValues(partner) : EMPTY_VALUES)
  }, [open, partner])

  /** Validates the form and submits the create or update request. */
  async function handleSave() {
    if (!values.name.trim()) {
      toast.error(t("partnersManage.form.nameRequired"))
      return
    }
    if (!values.logoUrl) {
      toast.error(t("partnersManage.form.logoRequired"))
      return
    }
    const payload: CreatePartnerRequest = {
      name: values.name.trim(),
      logoUrl: values.logoUrl,
      websiteUrl: orNull(values.websiteUrl),
      displayOrder: values.displayOrder.trim() ? Number(values.displayOrder) : null,
    }

    setSaving(true)
    try {
      if (partner) {
        await updatePartner(partner.id, payload)
        toast.success(t("partnersManage.toast.updated"))
      } else {
        await createPartner(payload)
        toast.success(t("partnersManage.toast.created"))
      }
      onOpenChange(false)
      onSaved()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("partnersManage.form.editTitle") : t("partnersManage.addPartner")}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("partnersManage.form.editDescription")
              : t("partnersManage.form.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t("partnersManage.form.logo")}</Label>
            <ImageUploadField
              value={values.logoUrl}
              onChange={(url) => setValues((v) => ({ ...v, logoUrl: url }))}
              aspectRatio="square"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("partnersManage.form.name")}</Label>
            <Input
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              placeholder={t("partnersManage.form.namePlaceholder")}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("partnersManage.form.websiteUrl")}</Label>
            <Input
              value={values.websiteUrl}
              onChange={(e) => setValues((v) => ({ ...v, websiteUrl: e.target.value }))}
              placeholder={t("partnersManage.form.websiteUrlPlaceholder")}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("partnersManage.form.displayOrder")}</Label>
            <Input
              type="number"
              value={values.displayOrder}
              onChange={(e) => setValues((v) => ({ ...v, displayOrder: e.target.value }))}
              placeholder={t("partnersManage.form.displayOrderPlaceholder")}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("partnersManage.cancel")}
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving
              ? t("partnersManage.form.saving")
              : isEdit
                ? t("partnersManage.form.save")
                : t("partnersManage.addPartner")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
