"use client"

import { useMemo, useState } from "react"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, Pencil, Plus, Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { BaseLayout } from "@/components/layouts/base-layout"
import { listPosts, publishPost } from "@/api/posts"
import { getErrorMessage } from "@/api/axios"
import { useAuthStore } from "@/store/authStore"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { localized } from "@/app/campaigns/components/campaign-constants"
import { STATUS_BADGE_ACTIVE, STATUS_BADGE_INACTIVE } from "@/lib/status-badges"
import type { PostSummary } from "@/types/post"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { NewsFormDialog } from "./components/news-form-dialog"

const PAGE_SIZE = 10
const ALL = "ALL"

/**
 * Formats an ISO date string as a Vietnamese short date, or a placeholder when absent.
 *
 * @param iso the ISO 8601 date string, or null when the post has never been published
 */
function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("vi-VN") : "—"
}

export default function NewsManagePage() {
  const { t, i18n } = useTranslation()
  const isAdmin = useAuthStore((s) => s.member?.role) === "ADMIN"

  const [page, setPage] = useState(0)
  const [publishedFilter, setPublishedFilter] = useState<typeof ALL | "true" | "false">(ALL)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search)
  const queryClient = useQueryClient()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<PostSummary | null>(null)

  const { data, isLoading: loading } = useQuery({
    queryKey: ["posts", { page, publishedFilter }],
    queryFn: () =>
      listPosts({
        page,
        size: PAGE_SIZE,
        published: publishedFilter === ALL ? undefined : publishedFilter === "true",
      }),
    // Keeps the previous page/filter's rows on screen while the next one loads.
    placeholderData: keepPreviousData,
  })

  /** Refetches every posts list query, regardless of the current page/filter. */
  function refreshPosts() {
    return queryClient.invalidateQueries({ queryKey: ["posts"] })
  }

  // listPosts has no server-side search param, so the currently loaded page is filtered client-side.
  const posts = useMemo(() => {
    const all = data?.content ?? []
    const query = debouncedSearch.trim().toLowerCase()
    if (!query) return all
    return all.filter((post) => localized(i18n.language, post.title, post.titleEn).toLowerCase().includes(query))
  }, [data, debouncedSearch, i18n.language])

  /** Opens the form dialog in create mode. */
  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  /**
   * Opens the form dialog in edit mode for the given post.
   *
   * @param post the post to edit
   */
  function openEdit(post: PostSummary) {
    setEditing(post)
    setFormOpen(true)
  }

  const publishToggleMutation = useMutation({
    mutationFn: ({ post, published }: { post: PostSummary; published: boolean }) => publishPost(post.id, published),
    onSuccess: (_result, { published }) => {
      toast.success(published ? t("news.manage.toast.published") : t("news.manage.toast.unpublished"))
      refreshPosts()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <BaseLayout title={t("news.manage.pageTitle")} description={t("news.manage.pageDescription")}>
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("news.manage.searchPlaceholder")}
                className="w-64 pl-9"
              />
            </div>
            <Select
              value={publishedFilter}
              onValueChange={(value) => {
                setPublishedFilter(value as typeof ALL | "true" | "false")
                setPage(0)
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("news.manage.status.all")}</SelectItem>
                <SelectItem value="true">{t("news.manage.status.published")}</SelectItem>
                <SelectItem value="false">{t("news.manage.status.draft")}</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-muted-foreground text-sm">
              {t("news.manage.total", { count: data?.totalElements ?? 0 })}
            </span>
          </div>
          <Button onClick={openCreate}>
            <Plus />
            {t("news.manage.addPost")}
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">{t("news.manage.table.title")}</TableHead>
                  <TableHead>{t("news.manage.table.tags")}</TableHead>
                  <TableHead>{t("news.manage.table.status")}</TableHead>
                  <TableHead>{t("news.manage.table.publishedAt")}</TableHead>
                  <TableHead className="w-px pr-4 text-center whitespace-nowrap">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-10 text-center">
                      {t("news.manage.loading")}
                    </TableCell>
                  </TableRow>
                ) : posts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-10 text-center">
                      {t("news.manage.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="max-w-md pl-4">
                        <div className="flex items-center gap-3">
                          {post.thumbnailUrl ? (
                            <img src={post.thumbnailUrl} alt="" className="size-10 shrink-0 rounded-md object-cover" />
                          ) : (
                            <div className="bg-muted size-10 shrink-0 rounded-md" />
                          )}
                          <span className="line-clamp-2">{localized(i18n.language, post.title, post.titleEn)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex max-w-56 flex-wrap gap-1">
                          {post.tags.length === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            post.tags.map((tag) => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Badge className={post.isPublished ? STATUS_BADGE_ACTIVE : STATUS_BADGE_INACTIVE}>
                            {post.isPublished ? t("news.manage.status.published") : t("news.manage.status.draft")}
                          </Badge>
                          {isAdmin && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                {/* Wrapper span keeps Tooltip's own data-state off the Switch's DOM
                                    node, since Switch uses data-state itself for checked/unchecked color. */}
                                <span className="inline-flex">
                                  <Switch
                                    aria-label={
                                      post.isPublished
                                        ? t("news.manage.unpublishAction")
                                        : t("news.manage.publishAction")
                                    }
                                    checked={post.isPublished}
                                    onCheckedChange={(checked) =>
                                      publishToggleMutation.mutate({ post, published: checked })
                                    }
                                  />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {post.isPublished ? t("news.manage.unpublishAction") : t("news.manage.publishAction")}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(post.publishedAt)}</TableCell>
                      <TableCell className="pr-4 text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={t("news.manage.edit")}
                              onClick={() => openEdit(post)}
                            >
                              <Pencil />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("news.manage.edit")}</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4">
          <span className="text-muted-foreground text-sm">
            {t("news.manage.page", { current: (data?.number ?? 0) + 1, total: data?.totalPages ?? 1 })}
          </span>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={t("common.previousPage")}
                  disabled={loading || (data?.first ?? true)}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("common.previousPage")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={t("common.nextPage")}
                  disabled={loading || (data?.last ?? true)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("common.nextPage")}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      <NewsFormDialog open={formOpen} onOpenChange={setFormOpen} post={editing} onSaved={refreshPosts} />
    </BaseLayout>
  )
}
