"use client"

import { useState } from "react"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { BaseLayout } from "@/components/layouts/base-layout"
import { deleteFaq, listFaqs, publishFaq } from "@/api/faqs"
import { getErrorMessage } from "@/api/axios"
import { useAuthStore } from "@/store/authStore"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { STATUS_BADGE_ACTIVE, STATUS_BADGE_INACTIVE } from "@/lib/status-badges"
import type { Faq } from "@/types/faq"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FaqFormDialog } from "./components/faq-form-dialog"
import { faqCategoryLabel } from "./components/faq-constants"

const PAGE_SIZE = 10
const ALL = "ALL"

export default function FaqManagePage() {
  const { t } = useTranslation()
  const isAdmin = useAuthStore((s) => s.member?.role) === "ADMIN"

  const [page, setPage] = useState(0)
  const [publishedFilter, setPublishedFilter] = useState<typeof ALL | "true" | "false">(ALL)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search)
  const queryClient = useQueryClient()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Faq | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Faq | null>(null)

  const { data, isLoading: loading } = useQuery({
    queryKey: ["faqs", { page, publishedFilter, debouncedSearch }],
    queryFn: () =>
      listFaqs({
        page,
        size: PAGE_SIZE,
        published: publishedFilter === ALL ? undefined : publishedFilter === "true",
        search: debouncedSearch || undefined,
      }),
    // Keeps the previous page/filter's rows on screen while the next one loads.
    placeholderData: keepPreviousData,
  })

  /** Refetches every FAQs list query, regardless of the current page/filter/search params. */
  function refreshFaqs() {
    return queryClient.invalidateQueries({ queryKey: ["faqs"] })
  }

  /** Opens the form dialog in create mode. */
  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  /**
   * Opens the form dialog in edit mode for the given FAQ.
   *
   * @param faq the FAQ to edit
   */
  function openEdit(faq: Faq) {
    setEditing(faq)
    setFormOpen(true)
  }

  const publishToggleMutation = useMutation({
    mutationFn: ({ faq, published }: { faq: Faq; published: boolean }) => publishFaq(faq.id, published),
    onSuccess: (_result, { published }) => {
      toast.success(published ? t("faqManage.toast.published") : t("faqManage.toast.unpublished"))
      refreshFaqs()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (faq: Faq) => deleteFaq(faq.id),
    onSuccess: async () => {
      toast.success(t("faqManage.toast.deleted"))
      await refreshFaqs()
      setDeleteTarget(null)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const faqs = data?.content ?? []

  return (
    <BaseLayout title={t("faqManage.title")} description={t("faqManage.description")}>
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
                placeholder={t("faqManage.searchPlaceholder")}
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
                <SelectItem value={ALL}>{t("faqManage.status.all")}</SelectItem>
                <SelectItem value="true">{t("faqManage.status.published")}</SelectItem>
                <SelectItem value="false">{t("faqManage.status.draft")}</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-muted-foreground text-sm">
              {t("faqManage.total", { count: data?.totalElements ?? 0 })}
            </span>
          </div>
          <Button onClick={openCreate}>
            <Plus />
            {t("faqManage.addQuestion")}
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">{t("faqManage.table.question")}</TableHead>
                  <TableHead>{t("faqManage.table.category")}</TableHead>
                  <TableHead>{t("faqManage.table.sortOrder")}</TableHead>
                  <TableHead>{t("faqManage.table.status")}</TableHead>
                  <TableHead className="w-px pr-4 text-center whitespace-nowrap">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-10 text-center">
                      {t("faqManage.loading")}
                    </TableCell>
                  </TableRow>
                ) : faqs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-10 text-center">
                      {t("faqManage.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  faqs.map((faq) => (
                    <TableRow key={faq.id}>
                      <TableCell className="max-w-md pl-4">
                        <span className="line-clamp-2">{faq.question}</span>
                      </TableCell>
                      <TableCell>{faqCategoryLabel(t, faq.category)}</TableCell>
                      <TableCell>{faq.sortOrder}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Badge className={faq.isPublished ? STATUS_BADGE_ACTIVE : STATUS_BADGE_INACTIVE}>
                            {faq.isPublished ? t("faqManage.status.published") : t("faqManage.status.draft")}
                          </Badge>
                          {isAdmin && (
                            <Switch
                              checked={faq.isPublished}
                              onCheckedChange={(checked) => publishToggleMutation.mutate({ faq, published: checked })}
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" title={t("faqManage.edit")} onClick={() => openEdit(faq)}>
                            <Pencil />
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title={t("faqManage.delete")}
                              onClick={() => setDeleteTarget(faq)}
                            >
                              <Trash2 className="text-destructive" />
                            </Button>
                          )}
                        </div>
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
            {t("faqManage.page", { current: (data?.number ?? 0) + 1, total: data?.totalPages ?? 1 })}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={loading || (data?.first ?? true)}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={loading || (data?.last ?? true)}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>

      <FaqFormDialog open={formOpen} onOpenChange={setFormOpen} faq={editing} onSaved={refreshFaqs} />

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("faqManage.deleteDialog.title")}</DialogTitle>
            <DialogDescription>{t("faqManage.deleteDialog.description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t("faqManage.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t("faqManage.deleteDialog.deleting") : t("faqManage.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BaseLayout>
  )
}
