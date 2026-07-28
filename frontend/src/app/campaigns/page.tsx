"use client"

import { useCallback, useEffect, useState } from "react"
import {
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  HandCoins,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { BaseLayout } from "@/components/layouts/base-layout"
import {
  deleteCampaign,
  listCampaigns,
  updateCampaignStatus,
} from "@/api/campaigns"
import { getErrorMessage } from "@/api/axios"
import { useAuthStore } from "@/store/authStore"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import type { CampaignStatus, CampaignSummary } from "@/types/campaign"
import type { Page } from "@/types/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  allowedTransitions,
  categoryLabel,
  formatVnd,
  localized,
  progressPercent,
  statusLabel,
  STATUS_OPTIONS,
  STATUS_BADGE_CLASSES,
} from "./components/campaign-constants"
import { CampaignFormDialog } from "./components/campaign-form-dialog"
import { DonationsDialog } from "./components/donations-dialog"
import { RegistrationsDialog } from "./components/registrations-dialog"

const PAGE_SIZE = 10
const ALL = "ALL"

/**
 * Formats an ISO date string as a Vietnamese short date.
 *
 * @param iso the ISO 8601 date string
 */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN")
}

/** Renders the campaign management page: a filterable, paginated list with create, edit, status and donation actions. */
export default function CampaignsPage() {
  const { t, i18n } = useTranslation()
  const isAdmin = useAuthStore((s) => s.member?.role) === "ADMIN"

  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | typeof ALL>(ALL)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search)
  const [data, setData] = useState<Page<CampaignSummary> | null>(null)
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CampaignSummary | null>(null)
  const [donationsOpen, setDonationsOpen] = useState(false)
  const [donationsTarget, setDonationsTarget] = useState<CampaignSummary | null>(null)
  const [registrationsOpen, setRegistrationsOpen] = useState(false)
  const [registrationsTarget, setRegistrationsTarget] = useState<CampaignSummary | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CampaignSummary | null>(null)
  const [deleting, setDeleting] = useState(false)

  /** Fetches the current page of campaigns and stores it, surfacing errors as a toast. */
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listCampaigns({
        page,
        size: PAGE_SIZE,
        status: statusFilter === ALL ? undefined : statusFilter,
        search: debouncedSearch || undefined,
      })
      setData(result)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, debouncedSearch])

  useEffect(() => {
    void load()
  }, [load])

  /** Opens the form dialog in create mode. */
  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  /**
   * Opens the form dialog in edit mode for the given campaign.
   *
   * @param campaign the campaign to edit
   */
  function openEdit(campaign: CampaignSummary) {
    setEditing(campaign)
    setFormOpen(true)
  }

  /**
   * Opens the donations management dialog for the given campaign.
   *
   * @param campaign the campaign whose donations to manage
   */
  function openDonations(campaign: CampaignSummary) {
    setDonationsTarget(campaign)
    setDonationsOpen(true)
  }

  /**
   * Opens the registrants management dialog for the given campaign.
   *
   * @param campaign the campaign whose registrants to manage
   */
  function openRegistrations(campaign: CampaignSummary) {
    setRegistrationsTarget(campaign)
    setRegistrationsOpen(true)
  }

  /**
   * Transitions a campaign to the target status, then refreshes the list.
   *
   * @param campaign the campaign to transition
   * @param status the target status
   */
  async function handleStatusChange(campaign: CampaignSummary, status: CampaignStatus) {
    try {
      await updateCampaignStatus(campaign.id, status)
      toast.success(t("campaigns.statusChanged", { status: statusLabel(t, status) }))
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  /** Deletes the campaign held in deleteTarget (only DRAFT campaigns), then refreshes. */
  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteCampaign(deleteTarget.id)
      toast.success(t("campaigns.deleted"))
      setDeleteTarget(null)
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const campaigns = data?.content ?? []

  return (
    <BaseLayout title={t("campaigns.title")} description={t("campaigns.description")}>
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
                placeholder={t("campaigns.searchPlaceholder")}
                className="w-64 pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as CampaignStatus | typeof ALL)
                setPage(0)
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("campaigns.allStatuses")}</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabel(t, status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground text-sm">
              {t("common.total", { count: data?.totalElements ?? 0 })}
            </span>
          </div>
          <Button onClick={openCreate}>
            <Plus />
            {t("campaigns.createButton")}
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">{t("campaigns.table.campaign")}</TableHead>
                  <TableHead>{t("campaigns.table.progress")}</TableHead>
                  <TableHead>{t("campaigns.table.status")}</TableHead>
                  <TableHead>{t("campaigns.table.startDate")}</TableHead>
                  <TableHead className="w-px pr-4 text-center whitespace-nowrap">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-10 text-center">
                      {t("common.loading")}
                    </TableCell>
                  </TableRow>
                ) : campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-10 text-center">
                      {t("campaigns.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  campaigns.map((campaign) => {
                    const transitions = allowedTransitions(campaign.status)
                    const canDelete = isAdmin && campaign.status === "DRAFT"
                    return (
                      <TableRow key={campaign.id}>
                        <TableCell className="pl-4">
                          <div className="flex items-center gap-3">
                            {campaign.thumbnailUrl ? (
                              <img
                                src={campaign.thumbnailUrl}
                                alt=""
                                className="size-10 shrink-0 rounded-md object-cover"
                              />
                            ) : (
                              <div className="bg-muted size-10 shrink-0 rounded-md" />
                            )}
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {localized(i18n.language, campaign.title, campaign.titleEn)}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {categoryLabel(t, campaign.category)}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex w-48 flex-col gap-1">
                            <Progress
                              value={progressPercent(campaign.currentAmount, campaign.targetAmount)}
                            />
                            <span className="text-muted-foreground text-xs">
                              {formatVnd(campaign.currentAmount)} / {formatVnd(campaign.targetAmount)}
                              {" · "}
                              {t("campaigns.donorCount", { count: campaign.donorCount })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_BADGE_CLASSES[campaign.status]}>
                            {statusLabel(t, campaign.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(campaign.startDate)}</TableCell>
                        <TableCell className="pr-4">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title={t("campaigns.actions.edit")}
                              onClick={() => openEdit(campaign)}
                            >
                              <Pencil />
                            </Button>

                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title={t("campaigns.actions.manageDonations")}
                                onClick={() => openDonations(campaign)}
                              >
                                <HandCoins />
                              </Button>
                            )}

                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title={t("campaigns.actions.manageRegistrations")}
                                onClick={() => openRegistrations(campaign)}
                              >
                                <Users />
                              </Button>
                            )}

                            {isAdmin && transitions.length > 0 && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" title={t("campaigns.actions.changeStatus")}>
                                    <ArrowRightLeft />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {transitions.map((status) => (
                                    <DropdownMenuItem
                                      key={status}
                                      onClick={() => handleStatusChange(campaign, status)}
                                    >
                                      {statusLabel(t, status)}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}

                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title={t("common.delete")}
                                onClick={() => setDeleteTarget(campaign)}
                              >
                                <Trash2 className="text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4">
          <span className="text-muted-foreground text-sm">
            {t("common.page", { current: (data?.number ?? 0) + 1, total: data?.totalPages ?? 1 })}
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

      <CampaignFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        campaign={editing}
        onSaved={load}
      />

      <DonationsDialog
        open={donationsOpen}
        onOpenChange={setDonationsOpen}
        campaign={donationsTarget}
        onChanged={load}
      />

      <RegistrationsDialog
        open={registrationsOpen}
        onOpenChange={setRegistrationsOpen}
        campaign={registrationsTarget}
      />

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("campaigns.deleteDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("campaigns.deleteDialog.description", { title: deleteTarget?.title })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? t("common.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BaseLayout>
  )
}
