"use client"

import { useCallback, useEffect, useState } from "react"
import { CheckCircle2, ChevronLeft, ChevronRight, Eye, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { BaseLayout } from "@/components/layouts/base-layout"
import { deleteInquiry, listInquiries, markInquiryHandled } from "@/api/inquiries"
import { getErrorMessage } from "@/api/axios"
import { INQUIRY_STATUS_BADGE_CLASSES } from "@/lib/status-badges"
import type { Inquiry, InquiryStatus, Page } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  const [data, setData] = useState<Page<Inquiry> | null>(null)
  const [loading, setLoading] = useState(true)

  const [viewing, setViewing] = useState<Inquiry | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Inquiry | null>(null)
  const [deleting, setDeleting] = useState(false)

  /** Fetches the current page of inquiries and stores it, surfacing errors as a toast. */
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listInquiries({
        page,
        size: PAGE_SIZE,
        status: statusFilter === ALL ? undefined : statusFilter,
      })
      setData(result)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  /**
   * Marks an inquiry as handled, then refreshes the list.
   *
   * @param inquiry the inquiry to mark handled
   */
  async function handleMarkHandled(inquiry: Inquiry) {
    try {
      await markInquiryHandled(inquiry.id)
      toast.success(t("inquiries.toast.markedHandled"))
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  /** Deletes the inquiry held in deleteTarget, then refreshes the list. */
  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteInquiry(deleteTarget.id)
      toast.success(t("inquiries.toast.deleted"))
      setDeleteTarget(null)
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

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
            {t("inquiries.total", { count: data?.totalElements ?? 0 })}
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
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t("inquiries.actions.viewDetail")}
                            onClick={() => setViewing(inquiry)}
                          >
                            <Eye />
                          </Button>
                          {inquiry.status === "NEW" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title={t("inquiries.actions.markHandled")}
                              onClick={() => handleMarkHandled(inquiry)}
                            >
                              <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t("inquiries.actions.delete")}
                            onClick={() => setDeleteTarget(inquiry)}
                          >
                            <Trash2 className="text-destructive" />
                          </Button>
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
            {t("inquiries.page", { current: (data?.number ?? 0) + 1, total: data?.totalPages ?? 1 })}
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
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? t("inquiries.deleteDialog.deleting") : t("inquiries.actions.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BaseLayout>
  )
}
