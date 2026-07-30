"use client"

import { useMemo, useRef, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { toast } from "sonner"
import { createPartner, updatePartner } from "@/api/partners"
import { getErrorMessage } from "@/api/axios"
import type { CreatePartnerRequest, Partner } from "@/types/partner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageUploadField, type ImageUploadHandle } from "@/components/image-upload-field"
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

/** Builds the partner form's zod schema with localized validation messages. */
function buildPartnerSchema(t: TFunction) {
  return z.object({
    name: z
      .string()
      .min(1, t("partnersManage.form.nameRequired"))
      .max(150, t("partnersManage.form.nameMax")),
    websiteUrl: z
      .url(t("partnersManage.form.invalidUrl"))
      .max(500, t("partnersManage.form.urlMax"))
      .or(z.literal("")),
  })
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
  onSaved: () => void | Promise<void>
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
  const partnerSchema = useMemo(() => buildPartnerSchema(t), [t])
  const isEdit = Boolean(partner)
  const [values, setValues] = useState<PartnerFormValues>(EMPTY_VALUES)
  const logoRef = useRef<ImageUploadHandle>(null)
  const [committingLogo, setCommittingLogo] = useState(false)

  // Resets the fields the moment the dialog opens for a (possibly different) partner, computed
  // during render instead of an effect so React doesn't paint the stale values first.
  const openKey = open ? (partner?.id ?? "new") : null
  const [lastOpenKey, setLastOpenKey] = useState<typeof openKey>(null)
  if (openKey !== null && openKey !== lastOpenKey) {
    setLastOpenKey(openKey)
    setValues(partner ? partnerToValues(partner) : EMPTY_VALUES)
  }

  const saveMutation = useMutation({
    mutationFn: (payload: CreatePartnerRequest) =>
      partner ? updatePartner(partner.id, payload) : createPartner(payload),
    // Awaits the refetch before closing so the list behind it never briefly shows stale data.
    onSuccess: async () => {
      toast.success(partner ? t("partnersManage.toast.updated") : t("partnersManage.toast.created"))
      await onSaved()
      onOpenChange(false)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  /** Validates the form and submits the create or update request. */
  async function handleSave() {
    const parsed = partnerSchema.safeParse({ name: values.name.trim(), websiteUrl: values.websiteUrl.trim() })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message)
      return
    }
    let logoUrl: string
    setCommittingLogo(true)
    try {
      logoUrl = (await logoRef.current?.commit()) ?? values.logoUrl
    } catch {
      return // ImageUploadField already surfaced the upload error.
    } finally {
      setCommittingLogo(false)
    }
    if (!logoUrl) {
      toast.error(t("partnersManage.form.logoRequired"))
      return
    }
    saveMutation.mutate({
      name: parsed.data.name,
      logoUrl,
      websiteUrl: orNull(parsed.data.websiteUrl),
      displayOrder: values.displayOrder.trim() ? Number(values.displayOrder) : null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("partnersManage.form.editTitle") : t("partnersManage.addPartner")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("partnersManage.form.editDescription") : t("partnersManage.form.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t("partnersManage.form.logo")}</Label>
            <ImageUploadField ref={logoRef} value={values.logoUrl} aspectRatio="square" />
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
          <Button type="button" onClick={handleSave} disabled={saveMutation.isPending || committingLogo}>
            {saveMutation.isPending || committingLogo
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
