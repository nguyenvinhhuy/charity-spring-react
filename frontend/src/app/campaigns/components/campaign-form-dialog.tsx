"use client"

import { useEffect, useMemo, useRef } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import type { TFunction } from "i18next"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { toast } from "sonner"
import { createCampaign, getCampaign, updateCampaign } from "@/api/campaigns"
import { getBankSettings } from "@/api/settings"
import { getErrorMessage } from "@/api/axios"
import { useAuthStore } from "@/store/authStore"
import type { CampaignDetail, CampaignSummary, CreateCampaignRequest } from "@/types/campaign"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUploadField, type ImageUploadHandle } from "@/components/image-upload-field"
import { CATEGORY_OPTIONS, categoryLabel } from "./campaign-constants"

/**
 * Builds the campaign form's zod schema with localized validation messages.
 *
 * @param t the translation function
 */
function buildCampaignSchema(t: TFunction) {
  return z
    .object({
      // Vietnamese content is required (the default language).
      title: z.string().min(1, t("campaigns.form.titleRequired")).max(255, t("campaigns.form.maxLength255")),
      summary: z.string().max(500, t("campaigns.form.maxLength500")).optional(),
      description: z
        .string()
        .min(1, t("campaigns.form.descriptionRequired"))
        .max(50000, t("campaigns.form.maxLength50000")),
      // English content is optional; the client falls back to Vietnamese when it is empty.
      titleEn: z.string().max(255, t("campaigns.form.maxLength255")).optional(),
      summaryEn: z.string().max(500, t("campaigns.form.maxLength500")).optional(),
      descriptionEn: z.string().max(50000, t("campaigns.form.maxLength50000")).optional(),
      category: z.enum(["CHILDREN", "EDUCATION", "HEALTHCARE", "DISASTER_RELIEF", "ELDERLY", "ENVIRONMENT", "OTHER"]),
      targetAmount: z
        .string()
        .min(1, t("campaigns.form.amountRequired"))
        .refine((v) => Number(v) > 0, t("campaigns.form.amountPositive")),
      bankAccountNo: z.string().min(1, t("campaigns.form.bankAccountNoRequired")),
      bankAccountName: z.string().min(1, t("campaigns.form.bankAccountNameRequired")),
      qrDescription: z.string().max(100, t("campaigns.form.maxLength100")).optional(),
      thienNguyenUrl: z.url(t("campaigns.form.invalidUrl")).or(z.literal("")).optional(),
      thumbnailUrl: z.url(t("campaigns.form.invalidUrl")).or(z.literal("")).optional(),
      startDate: z.string().min(1, t("campaigns.form.startDateRequired")),
      endDate: z.string().optional(),
      // Dates of the on-ground activity, separate from the fundraising period above; not every campaign has one.
      eventStartDate: z.string().optional(),
      eventEndDate: z.string().optional(),
      // Max participants for the on-ground event; only valid together with eventStartDate (enforced below).
      capacity: z.string().optional(),
    })
    .superRefine((values, ctx) => {
      const hasEventStart = !!values.eventStartDate
      const hasCapacity = !!values.capacity
      if (hasCapacity && !hasEventStart) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["eventStartDate"],
          message: t("campaigns.form.capacityRequiresEventDate"),
        })
      }
      if (hasEventStart && !hasCapacity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["capacity"],
          message: t("campaigns.form.eventDateRequiresCapacity"),
        })
      }
      if (hasCapacity && Number(values.capacity) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["capacity"],
          message: t("campaigns.form.capacityPositive"),
        })
      }
    })
}

type CampaignFormValues = z.infer<ReturnType<typeof buildCampaignSchema>>

const EMPTY_VALUES: CampaignFormValues = {
  title: "",
  summary: "",
  description: "",
  titleEn: "",
  summaryEn: "",
  descriptionEn: "",
  category: "OTHER",
  targetAmount: "",
  bankAccountNo: "",
  bankAccountName: "",
  qrDescription: "",
  thienNguyenUrl: "",
  thumbnailUrl: "",
  startDate: "",
  endDate: "",
  eventStartDate: "",
  eventEndDate: "",
  capacity: "",
}

/**
 * Maps a fetched campaign detail into the flat form values.
 *
 * @param detail the fetched campaign detail
 */
function detailToValues(detail: CampaignDetail): CampaignFormValues {
  return {
    title: detail.title,
    summary: detail.summary ?? "",
    description: detail.description,
    titleEn: detail.titleEn ?? "",
    summaryEn: detail.summaryEn ?? "",
    descriptionEn: detail.descriptionEn ?? "",
    category: detail.category,
    targetAmount: String(detail.targetAmount),
    bankAccountNo: detail.bankAccountNo,
    bankAccountName: detail.bankAccountName,
    qrDescription: detail.qrDescription ?? "",
    thienNguyenUrl: detail.thienNguyenUrl ?? "",
    thumbnailUrl: detail.thumbnailUrl ?? "",
    startDate: detail.startDate,
    endDate: detail.endDate ?? "",
    eventStartDate: detail.eventStartDate ?? "",
    eventEndDate: detail.eventEndDate ?? "",
    capacity: detail.capacity != null ? String(detail.capacity) : "",
  }
}

/**
 * Turns an empty string into null, keeping non-empty strings as-is.
 *
 * @param value the raw form field value
 */
function orNull(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

interface CampaignFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the dialog edits this campaign; otherwise it creates a new one. */
  campaign?: CampaignSummary | null
  onSaved: () => void | Promise<void>
}

/**
 * Dialog form for creating a new campaign or editing an existing one.
 *
 * @param open whether the dialog is visible
 * @param onOpenChange invoked when the dialog's open state should change
 * @param campaign when set, the dialog edits this campaign; otherwise it creates a new one
 * @param onSaved invoked after a successful create or update
 */
export function CampaignFormDialog({ open, onOpenChange, campaign, onSaved }: CampaignFormDialogProps) {
  const { t } = useTranslation()
  const campaignSchema = useMemo(() => buildCampaignSchema(t), [t])
  const isEdit = Boolean(campaign)
  const isAdmin = useAuthStore((s) => s.member?.role) === "ADMIN"
  const thumbnailRef = useRef<ImageUploadHandle>(null)

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: EMPTY_VALUES,
  })

  // Pre-fills the club's default bank account for a new campaign; CONTRIBUTOR cannot change it
  // (fields disabled below), and it saves ADMIN a lookup even though they are still free to override it.
  const bankDefaultsQuery = useQuery({
    queryKey: ["bank-settings"],
    queryFn: getBankSettings,
    enabled: open && !campaign,
  })

  const detailQuery = useQuery({
    queryKey: ["campaigns", "detail", campaign?.slug],
    queryFn: () => getCampaign(campaign!.slug),
    enabled: open && !!campaign,
  })
  const loadingDetail = detailQuery.isLoading && isEdit
  // Keep the existing statementUrl on edit so an update does not wipe it (the form does not expose it).
  const statementUrl = detailQuery.data?.statementUrl ?? null

  // Resets the form once the relevant fetch (bank defaults or campaign detail) has data, keyed on the
  // dialog opening for a (possibly different) campaign — form.reset() is react-hook-form's own store,
  // not a React state setter, so this effect isn't subject to the "fetch, then setState" restriction.
  useEffect(() => {
    if (!open) return
    if (campaign) {
      if (detailQuery.data) form.reset(detailToValues(detailQuery.data))
    } else if (bankDefaultsQuery.data) {
      form.reset({
        ...EMPTY_VALUES,
        bankAccountNo: bankDefaultsQuery.data.bankAccountNo,
        bankAccountName: bankDefaultsQuery.data.bankAccountName,
      })
    } else if (bankDefaultsQuery.isError) {
      form.reset(EMPTY_VALUES)
    }
  }, [open, campaign, detailQuery.data, bankDefaultsQuery.data, bankDefaultsQuery.isError, form])

  const saveMutation = useMutation({
    mutationFn: (payload: CreateCampaignRequest) =>
      campaign ? updateCampaign(campaign.id, payload) : createCampaign(payload),
    // Awaits the refetch before closing so the list behind it never briefly shows stale data.
    onSuccess: async () => {
      toast.success(campaign ? t("campaigns.form.updated") : t("campaigns.form.created"))
      await onSaved()
      onOpenChange(false)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  /**
   * Submits the form, creating or updating the campaign.
   *
   * @param values the validated form values
   */
  async function onSubmit(values: CampaignFormValues) {
    let thumbnailUrl: string | null
    try {
      thumbnailUrl = orNull((await thumbnailRef.current?.commit()) ?? values.thumbnailUrl ?? "")
    } catch {
      return // ImageUploadField already surfaced the upload error.
    }
    const payload: CreateCampaignRequest = {
      title: values.title.trim(),
      summary: orNull(values.summary),
      description: values.description,
      titleEn: orNull(values.titleEn),
      summaryEn: orNull(values.summaryEn),
      descriptionEn: orNull(values.descriptionEn),
      category: values.category,
      targetAmount: Number(values.targetAmount),
      thumbnailUrl,
      images: [],
      bankAccountNo: values.bankAccountNo.trim(),
      bankAccountName: values.bankAccountName.trim(),
      qrDescription: orNull(values.qrDescription),
      thienNguyenUrl: orNull(values.thienNguyenUrl),
      statementUrl: isEdit ? statementUrl : null,
      startDate: values.startDate,
      endDate: orNull(values.endDate),
      eventStartDate: orNull(values.eventStartDate),
      eventEndDate: orNull(values.eventEndDate),
      capacity: values.capacity ? Number(values.capacity) : null,
    }
    saveMutation.mutate(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("campaigns.form.editTitle") : t("campaigns.form.createTitle")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("campaigns.form.editDescription") : t("campaigns.form.createDescription")}
          </DialogDescription>
        </DialogHeader>

        {loadingDetail ? (
          <div className="text-muted-foreground py-10 text-center text-sm">{t("common.loading")}</div>
        ) : (
          <Form {...form}>
            <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="thumbnailUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("campaigns.form.thumbnailUrlLabel")}</FormLabel>
                    <FormControl>
                      <ImageUploadField ref={thumbnailRef} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bilingual content: Vietnamese is required, English is optional (falls back to VI). */}
              <Tabs defaultValue="vi">
                <TabsList className="w-full">
                  <TabsTrigger value="vi">{t("campaigns.form.tabVi")}</TabsTrigger>
                  <TabsTrigger value="en">{t("campaigns.form.tabEn")}</TabsTrigger>
                </TabsList>

                <TabsContent value="vi" className="mt-4 flex flex-col gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("campaigns.form.titleLabel")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("campaigns.form.titlePlaceholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("campaigns.form.summaryLabel")}</FormLabel>
                        <FormControl>
                          <Textarea rows={2} placeholder={t("campaigns.form.summaryPlaceholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("campaigns.form.descriptionLabel")}</FormLabel>
                        <FormControl>
                          <Textarea rows={5} placeholder={t("campaigns.form.descriptionPlaceholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="en" className="mt-4 flex flex-col gap-4">
                  <p className="text-muted-foreground text-xs">{t("campaigns.form.enHint")}</p>
                  <FormField
                    control={form.control}
                    name="titleEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("campaigns.form.titleLabel")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="summaryEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("campaigns.form.summaryLabel")}</FormLabel>
                        <FormControl>
                          <Textarea rows={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="descriptionEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("campaigns.form.descriptionLabel")}</FormLabel>
                        <FormControl>
                          <Textarea rows={5} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("campaigns.form.categoryLabel")}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORY_OPTIONS.map((category) => (
                            <SelectItem key={category} value={category}>
                              {categoryLabel(t, category)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("campaigns.form.targetAmountLabel")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={1000} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="bankAccountNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("campaigns.form.bankAccountNoLabel")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("campaigns.form.bankAccountNoPlaceholder")}
                          disabled={!isAdmin}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankAccountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("campaigns.form.bankAccountNameLabel")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("campaigns.form.bankAccountNamePlaceholder")}
                          disabled={!isAdmin}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {!isAdmin && (
                <p className="text-muted-foreground -mt-2 text-xs">{t("campaigns.form.bankAccountLockedHint")}</p>
              )}

              <FormField
                control={form.control}
                name="qrDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("campaigns.form.qrDescriptionLabel")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("campaigns.form.qrDescriptionPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="thienNguyenUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("campaigns.form.thienNguyenUrlLabel")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("campaigns.form.thienNguyenUrlPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("campaigns.form.startDateLabel")}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("campaigns.form.endDateLabel")}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">{t("campaigns.form.eventSectionTitle")}</p>
                <p className="text-muted-foreground text-xs">{t("campaigns.form.eventSectionHint")}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="eventStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("campaigns.form.eventStartDateLabel")}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eventEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("campaigns.form.eventEndDateLabel")}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("campaigns.form.capacityLabel")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} placeholder={t("campaigns.form.capacityPlaceholder")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={saveMutation.isPending || form.formState.isSubmitting}>
                  {saveMutation.isPending || form.formState.isSubmitting
                    ? t("common.saving")
                    : isEdit
                      ? t("campaigns.form.saveChanges")
                      : t("campaigns.createButton")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
