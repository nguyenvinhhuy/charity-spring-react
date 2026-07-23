"use client"

import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import type { TFunction } from "i18next"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { toast } from "sonner"
import { createPost, getPost, updatePost } from "@/api/posts"
import { getErrorMessage } from "@/api/axios"
import type { CreatePostRequest, PostDetail, PostSummary } from "@/types"
import { RichTextEditor } from "@/components/rich-text-editor"
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

/**
 * Builds the news form's zod schema with localized validation messages.
 *
 * @param t the translation function
 */
function buildNewsSchema(t: TFunction) {
  return z.object({
    // Vietnamese content is required (the default language).
    title: z.string().min(1, t("news.manage.form.titleRequired")),
    summary: z.string().optional(),
    content: z.string().min(1, t("news.manage.form.contentRequired")),
    // English content is optional; the client falls back to Vietnamese when it is empty.
    titleEn: z.string().optional(),
    summaryEn: z.string().optional(),
    contentEn: z.string().optional(),
    thumbnailUrl: z.string().url(t("news.manage.form.invalidUrl")).or(z.literal("")).optional(),
    // Comma-separated tags, split into a string[] only when building the submit payload.
    tags: z.string().optional(),
  })
}

type NewsFormValues = z.infer<ReturnType<typeof buildNewsSchema>>

const EMPTY_VALUES: NewsFormValues = {
  title: "",
  summary: "",
  content: "",
  titleEn: "",
  summaryEn: "",
  contentEn: "",
  thumbnailUrl: "",
  tags: "",
}

/**
 * Maps a fetched post detail into the flat form values.
 *
 * @param detail the fetched post detail
 */
function detailToValues(detail: PostDetail): NewsFormValues {
  return {
    title: detail.title,
    summary: detail.summary ?? "",
    content: detail.content,
    titleEn: detail.titleEn ?? "",
    summaryEn: detail.summaryEn ?? "",
    contentEn: detail.contentEn ?? "",
    thumbnailUrl: detail.thumbnailUrl ?? "",
    tags: detail.tags.join(", "),
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

interface NewsFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the dialog edits this post; otherwise it creates a new one. */
  post?: PostSummary | null
  onSaved: () => void
}

/**
 * Dialog form for creating a new post or editing an existing one.
 *
 * @param open whether the dialog is visible
 * @param onOpenChange invoked when the dialog's open state should change
 * @param post when set, the dialog edits this post; otherwise it creates a new one
 * @param onSaved invoked after a successful create or update
 */
export function NewsFormDialog({ open, onOpenChange, post, onSaved }: NewsFormDialogProps) {
  const { t } = useTranslation()
  const newsSchema = useMemo(() => buildNewsSchema(t), [t])
  const isEdit = Boolean(post)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const form = useForm<NewsFormValues>({
    resolver: zodResolver(newsSchema),
    defaultValues: EMPTY_VALUES,
  })

  // When opening, reset to empty (create) or fetch and prefill the post detail (edit) — the list only
  // carries PostSummary, which does not include content/contentEn.
  useEffect(() => {
    if (!open) return
    if (!post) {
      form.reset(EMPTY_VALUES)
      return
    }
    let active = true
    setLoadingDetail(true)
    getPost(post.slug)
      .then((detail) => {
        if (!active) return
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
    // Re-run whenever the dialog opens or the target post changes.

  }, [open, post])

  /**
   * Submits the form, creating or updating the post, then closes on success.
   *
   * @param values the validated form values
   */
  async function onSubmit(values: NewsFormValues) {
    const payload: CreatePostRequest = {
      title: values.title.trim(),
      summary: orNull(values.summary),
      content: values.content,
      titleEn: orNull(values.titleEn),
      summaryEn: orNull(values.summaryEn),
      contentEn: orNull(values.contentEn),
      thumbnailUrl: orNull(values.thumbnailUrl),
      tags: (values.tags ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    }

    try {
      if (post) {
        await updatePost(post.id, payload)
        toast.success(t("news.manage.toast.updated"))
      } else {
        await createPost(payload)
        toast.success(t("news.manage.toast.created"))
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
          <DialogTitle>{isEdit ? t("news.manage.form.editTitle") : t("news.manage.addPost")}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("news.manage.form.editDescription")
              : t("news.manage.form.createDescription")}
          </DialogDescription>
        </DialogHeader>

        {loadingDetail ? (
          <div className="text-muted-foreground py-10 text-center text-sm">{t("news.manage.loading")}</div>
        ) : (
          <Form {...form}>
            <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              {/* Bilingual content: Vietnamese is required, English is optional (falls back to VI). */}
              <Tabs defaultValue="vi">
                <TabsList className="w-full">
                  <TabsTrigger value="vi">{t("news.manage.form.tabVi")}</TabsTrigger>
                  <TabsTrigger value="en">{t("news.manage.form.tabEn")}</TabsTrigger>
                </TabsList>

                <TabsContent value="vi" className="mt-4 flex flex-col gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("news.manage.form.titleLabel")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("news.manage.form.titlePlaceholder")} {...field} />
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
                        <FormLabel>{t("news.manage.form.summaryLabel")}</FormLabel>
                        <FormControl>
                          <Textarea rows={2} placeholder={t("news.manage.form.summaryPlaceholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("news.manage.form.contentLabel")}</FormLabel>
                        <FormControl>
                          <RichTextEditor value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="en" className="mt-4 flex flex-col gap-4">
                  <p className="text-muted-foreground text-xs">
                    {t("news.manage.form.enHint")}
                  </p>
                  <FormField
                    control={form.control}
                    name="titleEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("news.manage.form.titleLabel")}</FormLabel>
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
                        <FormLabel>{t("news.manage.form.summaryLabel")}</FormLabel>
                        <FormControl>
                          <Textarea rows={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contentEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("news.manage.form.contentLabel")}</FormLabel>
                        <FormControl>
                          <RichTextEditor value={field.value ?? ""} onChange={field.onChange} />
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
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("news.manage.form.tagsLabel")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("news.manage.form.tagsPlaceholder")} {...field} />
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
                      <FormLabel>{t("news.manage.form.thumbnailUrlLabel")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("news.manage.form.thumbnailUrlPlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t("news.manage.cancel")}
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting
                    ? t("news.manage.form.saving")
                    : isEdit
                      ? t("news.manage.form.save")
                      : t("news.manage.addPost")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
