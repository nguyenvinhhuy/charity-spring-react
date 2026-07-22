"use client"

import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import type { TFunction } from "i18next"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { toast } from "sonner"
import {
  createCampaign,
  getCampaign,
  updateCampaign,
} from "@/api/campaigns"
import { getErrorMessage } from "@/api/axios"
import type { CampaignDetail, CampaignSummary, CreateCampaignRequest } from "@/types"
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CATEGORY_OPTIONS, categoryLabel } from "./campaign-constants"

/**
 * Builds the campaign form's zod schema with localized validation messages.
 *
 * @param t the translation function
 */
function buildCampaignSchema(t: TFunction) {
  return z.object({
    // Vietnamese content is required (the default language).
    title: z.string().min(1, t("campaigns.form.titleRequired")),
    summary: z.string().max(500, t("campaigns.form.maxLength500")).optional(),
    description: z.string().min(1, t("campaigns.form.descriptionRequired")),
    // English content is optional; the client falls back to Vietnamese when it is empty.
    titleEn: z.string().max(255, t("campaigns.form.maxLength255")).optional(),
    summaryEn: z.string().max(500, t("campaigns.form.maxLength500")).optional(),
    descriptionEn: z.string().optional(),
    category: z.enum([
      "CHILDREN",
      "EDUCATION",
      "HEALTHCARE",
      "DISASTER_RELIEF",
      "ELDERLY",
      "ENVIRONMENT",
      "OTHER",
    ]),
    targetAmount: z
      .string()
      .min(1, t("campaigns.form.amountRequired"))
      .refine((v) => Number(v) > 0, t("campaigns.form.amountPositive")),
    bankAccountNo: z.string().min(1, t("campaigns.form.bankAccountNoRequired")),
    bankAccountName: z.string().min(1, t("campaigns.form.bankAccountNameRequired")),
    qrDescription: z.string().max(100, t("campaigns.form.maxLength100")).optional(),
    thienNguyenUrl: z.string().url(t("campaigns.form.invalidUrl")).or(z.literal("")).optional(),
    thumbnailUrl: z.string().url(t("campaigns.form.invalidUrl")).or(z.literal("")).optional(),
    startDate: z.string().min(1, t("campaigns.form.startDateRequired")),
    endDate: z.string().optional(),
    // Dates of the on-ground activity, separate from the fundraising period above; not every campaign has one.
    eventStartDate: z.string().optional(),
    eventEndDate: z.string().optional(),
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
  onSaved: () => void
}

/**
 * Dialog form for creating a new campaign or editing an existing one.
 *
 * @param open whether the dialog is visible
 * @param onOpenChange invoked when the dialog's open state should change
 * @param campaign when set, the dialog edits this campaign; otherwise it creates a new one
 * @param onSaved invoked after a successful create or update
 */
export function CampaignFormDialog({
  open,
  onOpenChange,
  campaign,
  onSaved,
}: CampaignFormDialogProps) {
  const { t } = useTranslation()
  const campaignSchema = useMemo(() => buildCampaignSchema(t), [t])
  const isEdit = Boolean(campaign)
  const [loadingDetail, setLoadingDetail] = useState(false)
  // Keep the existing statementUrl on edit so an update does not wipe it (the form does not expose it).
  const [statementUrl, setStatementUrl] = useState<string | null>(null)

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: EMPTY_VALUES,
  })

  // When opening, reset to empty (create) or fetch and prefill the campaign detail (edit).
  useEffect(() => {
    if (!open) return
    if (!campaign) {
      setStatementUrl(null)
      form.reset(EMPTY_VALUES)
      return
    }
    let active = true
    setLoadingDetail(true)
    getCampaign(campaign.slug)
      .then((detail) => {
        if (!active) return
        setStatementUrl(detail.statementUrl ?? null)
        form.reset(detailToValues(detail))
      })
      .catch((err) => {
        if (active) toast.error(getErrorMessage(err))
      })
      .finally(() => {
        if (active) setLoadingDetail(false)
      })
    return () => {
      active = false
    }
    // Re-run whenever the dialog opens or the target campaign changes.

  }, [open, campaign])

  /**
   * Submits the form, creating or updating the campaign, then closes on success.
   *
   * @param values the validated form values
   */
  async function onSubmit(values: CampaignFormValues) {
    const payload: CreateCampaignRequest = {
      title: values.title.trim(),
      summary: orNull(values.summary),
      description: values.description,
      titleEn: orNull(values.titleEn),
      summaryEn: orNull(values.summaryEn),
      descriptionEn: orNull(values.descriptionEn),
      category: values.category,
      targetAmount: Number(values.targetAmount),
      thumbnailUrl: orNull(values.thumbnailUrl),
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
    }

    try {
      if (campaign) {
        await updateCampaign(campaign.id, payload)
        toast.success(t("campaigns.form.updated"))
      } else {
        await createCampaign(payload)
        toast.success(t("campaigns.form.created"))
      }
      onOpenChange(false)
      onSaved()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("campaigns.form.editTitle") : t("campaigns.form.createTitle")}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("campaigns.form.editDescription")
              : t("campaigns.form.createDescription")}
          </DialogDescription>
        </DialogHeader>

        {loadingDetail ? (
          <div className="text-muted-foreground py-10 text-center text-sm">{t("common.loading")}</div>
        ) : (
          <Form {...form}>
            <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
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
                  <p className="text-muted-foreground text-xs">
                    {t("campaigns.form.enHint")}
                  </p>
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
                        <Input placeholder={t("campaigns.form.bankAccountNoPlaceholder")} {...field} />
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
                        <Input placeholder={t("campaigns.form.bankAccountNamePlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

              <FormField
                control={form.control}
                name="thumbnailUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("campaigns.form.thumbnailUrlLabel")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("campaigns.form.thumbnailUrlPlaceholder")} {...field} />
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
                <p className="text-muted-foreground text-xs">
                  {t("campaigns.form.eventSectionHint")}
                </p>
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
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting
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
