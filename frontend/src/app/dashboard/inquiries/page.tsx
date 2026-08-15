"use client"

import { useState } from "react"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, ChevronLeft, ChevronRight, Eye, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { BaseLayout } from "@/components/layouts/base-layout"
import { deleteInquiry, listInquiries, markInquiryHandled } from "@/api/inquiries"
import { getErrorMessage } from "@/api/axios"
import { INQUIRY_STATUS_BADGE_CLASSES } from "@/lib/status-badges"
import type { Inquiry, InquiryStatus } from "@/types/inquiry"
import { isFirstPage, isLastPage } from "@/types/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const PAGE_SIZE = 10
const ALL = "ALL"

/**
 * Formats an ISO date string as a Vietnamese short date and time.
 *
 * @param iso the ISO 8601 date string
 */
function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN")
}

export default function InquiriesManagePage() {
  const { t } = useTranslation()

  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<typeof ALL | InquiryStatus>(ALL)
  const queryClient = useQueryClient()

  const [viewing, setViewing] = useState<Inquiry | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Inquiry | null>(null)

  const { data, isLoading: loading } = useQuery({
    queryKey: ["inquiries", { page, statusFilter }],
    queryFn: () =>
      listInquiries({
        page,
        size: PAGE_SIZE,
        status: statusFilter === ALL ? undefined : statusFilter,
      }),
    // Keeps the previous page/filter's rows on screen while the next one loads.
    placeholderData: keepPreviousData,
  })

  /** Refetches every inquiries list query, regardless of the current page/filter. */
  function refreshInquiries() {
    return queryClient.invalidateQueries({ queryKey: ["inquiries"] })
  }

  const markHandledMutation = useMutation({
    mutationFn: (inquiry: Inquiry) => markInquiryHandled(inquiry.id),
    onSuccess: async () => {
      toast.success(t("inquiries.toast.markedHandled"))
      await refreshInquiries()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (inquiry: Inquiry) => deleteInquiry(inquiry.id),
    onSuccess: async () => {
      toast.success(t("inquiries.toast.deleted"))
      await refreshInquiries()
      setDeleteTarget(null)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const inquiries = data?.content ?? []

  return (
    <BaseLayout title={t("inquiries.pageTitle")} description={t("inquiries.pageDescription")}>
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as typeof ALL | InquiryStatus)
              setPage(0)
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("inquiries.status.all")}</SelectItem>
              <SelectItem value="NEW">{t("inquiries.status.new")}</SelectItem>
              <SelectItem value="HANDLED">{t("inquiries.status.handled")}</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-muted-foreground text-sm">
            {t("inquiries.total", { count: data?.page.totalElements ?? 0 })}
          </span>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">{t("inquiries.table.sender")}</TableHead>
                  <TableHead>{t("inquiries.table.subject")}</TableHead>
                  <TableHead>{t("inquiries.table.status")}</TableHead>
                  <TableHead>{t("inquiries.table.date")}</TableHead>
                  <TableHead className="w-px pr-4 text-center whitespace-nowrap">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-10 text-center">
                      {t("inquiries.loading")}
                    </TableCell>
                  </TableRow>
                ) : inquiries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-10 text-center">
                      {t("inquiries.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  inquiries.map((inquiry) => (
                    <TableRow key={inquiry.id}>
                      <TableCell className="max-w-56 pl-4">
                        <div className="flex flex-col">
                          <span className="truncate font-medium">{inquiry.fullName}</span>
                          <span className="text-muted-foreground truncate text-xs">{inquiry.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{inquiry.subject}</TableCell>
                      <TableCell>
                        <Badge className={INQUIRY_STATUS_BADGE_CLASSES[inquiry.status]}>
                          {inquiry.status === "HANDLED" ? t("inquiries.status.handled") : t("inquiries.status.new")}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(inquiry.createdAt)}</TableCell>
                      <TableCell className="pr-4">
                        <div className="flex items-center justify-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t("inquiries.actions.viewDetail")}
                                onClick={() => setViewing(inquiry)}
                              >
                                <Eye />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t("inquiries.actions.viewDetail")}</TooltipContent>
                          </Tooltip>
                          {inquiry.status === "NEW" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={t("inquiries.actions.markHandled")}
                                  onClick={() => markHandledMutation.mutate(inquiry)}
                                >
                                  <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t("inquiries.actions.markHandled")}</TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t("inquiries.actions.delete")}
                                onClick={() => setDeleteTarget(inquiry)}
                              >
                                <Trash2 className="text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t("inquiries.actions.delete")}</TooltipContent>
                          </Tooltip>
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
            {t("inquiries.page", { current: (data?.page.number ?? 0) + 1, total: data?.page.totalPages ?? 1 })}
          </span>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={t("common.previousPage")}
                  disabled={loading || (data ? isFirstPage(data.page) : true)}
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
                  disabled={loading || (data ? isLastPage(data.page) : true)}
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

      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewing?.subject}</DialogTitle>
            <DialogDescription>
              {viewing && `${viewing.fullName} · ${viewing.email} · ${formatDateTime(viewing.createdAt)}`}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm whitespace-pre-wrap">{viewing?.message}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>
              {t("inquiries.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("inquiries.deleteDialog.title")}</DialogTitle>
            <DialogDescription>{t("inquiries.deleteDialog.description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t("inquiries.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t("inquiries.deleteDialog.deleting") : t("inquiries.actions.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BaseLayout>
  )
}
