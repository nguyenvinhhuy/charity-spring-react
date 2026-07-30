"use client"

import { useEffect, useMemo, useRef } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import type { TFunction } from "i18next"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { toast } from "sonner"
import { createPost, getPost, updatePost } from "@/api/posts"
import { getErrorMessage } from "@/api/axios"
import type { CreatePostRequest, PostDetail, PostSummary } from "@/types/post"
import { RichTextEditor } from "@/components/rich-text-editor"
import { ImageUploadField, type ImageUploadHandle } from "@/components/image-upload-field"
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

/**
 * Builds the news form's zod schema with localized validation messages.
 *
 * @param t the translation function
 */
function buildNewsSchema(t: TFunction) {
  return z.object({
    // Vietnamese content is required (the default language).
    title: z.string().min(1, t("news.manage.form.titleRequired")).max(255, t("news.manage.form.maxLength255")),
    summary: z.string().max(500, t("news.manage.form.maxLength500")).optional(),
    content: z
      .string()
      .min(1, t("news.manage.form.contentRequired"))
      .max(50000, t("news.manage.form.maxLength50000")),
    // English content is optional; the client falls back to Vietnamese when it is empty.
    titleEn: z.string().max(255, t("news.manage.form.maxLength255")).optional(),
    summaryEn: z.string().max(500, t("news.manage.form.maxLength500")).optional(),
    contentEn: z.string().max(50000, t("news.manage.form.maxLength50000")).optional(),
    thumbnailUrl: z.url(t("news.manage.form.invalidUrl")).or(z.literal("")).optional(),
    // Comma-separated tags, split into a string[] only when building the submit payload.
    tags: z
      .string()
      .optional()
      .refine((v) => splitTags(v).length <= 10, t("news.manage.form.tagsCountMax"))
      .refine((v) => splitTags(v).every((tag) => tag.length <= 30), t("news.manage.form.tagsLengthMax")),
  })
}

/** Splits the comma-separated tags string into trimmed, non-empty tags. */
function splitTags(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
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
  onSaved: () => void | Promise<void>
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
  const thumbnailRef = useRef<ImageUploadHandle>(null)

  const form = useForm<NewsFormValues>({
    resolver: zodResolver(newsSchema),
    defaultValues: EMPTY_VALUES,
  })

  // The list only carries PostSummary, which does not include content/contentEn, so editing needs
  // its own detail fetch.
  const detailQuery = useQuery({
    queryKey: ["posts", "detail", post?.slug],
    queryFn: () => getPost(post!.slug),
    enabled: open && !!post,
  })
  const loadingDetail = detailQuery.isLoading && isEdit

  // Resets to empty (create) or to the fetched detail (edit) — form.reset() is react-hook-form's own
  // store, not a React state setter, so this effect isn't subject to the "fetch, then setState" rule.
  useEffect(() => {
    if (!open) return
    if (!post) {
      form.reset(EMPTY_VALUES)
    } else if (detailQuery.data) {
      form.reset(detailToValues(detailQuery.data))
    }
  }, [open, post, detailQuery.data, form])

  const saveMutation = useMutation({
    mutationFn: (payload: CreatePostRequest) => (post ? updatePost(post.id, payload) : createPost(payload)),
    // Awaits the refetch before closing so the list behind it never briefly shows stale data.
    onSuccess: async () => {
      toast.success(post ? t("news.manage.toast.updated") : t("news.manage.toast.created"))
      await onSaved()
      onOpenChange(false)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  /**
   * Submits the form, creating or updating the post.
   *
   * @param values the validated form values
   */
  async function onSubmit(values: NewsFormValues) {
    let thumbnailUrl: string | null
    try {
      thumbnailUrl = orNull((await thumbnailRef.current?.commit()) ?? values.thumbnailUrl ?? "")
    } catch {
      return // ImageUploadField already surfaced the upload error.
    }
    const payload: CreatePostRequest = {
      title: values.title.trim(),
      summary: orNull(values.summary),
      content: values.content,
      titleEn: orNull(values.titleEn),
      summaryEn: orNull(values.summaryEn),
      contentEn: orNull(values.contentEn),
      thumbnailUrl,
      tags: splitTags(values.tags),
    }
    saveMutation.mutate(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("news.manage.form.editTitle") : t("news.manage.addPost")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("news.manage.form.editDescription") : t("news.manage.form.createDescription")}
          </DialogDescription>
        </DialogHeader>

        {loadingDetail ? (
          <div className="text-muted-foreground py-10 text-center text-sm">{t("news.manage.loading")}</div>
        ) : (
          <Form {...form}>
            <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="thumbnailUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("news.manage.form.thumbnailUrlLabel")}</FormLabel>
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
                  <p className="text-muted-foreground text-xs">{t("news.manage.form.enHint")}</p>
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

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t("news.manage.cancel")}
                </Button>
                <Button type="submit" disabled={saveMutation.isPending || form.formState.isSubmitting}>
                  {saveMutation.isPending || form.formState.isSubmitting
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
