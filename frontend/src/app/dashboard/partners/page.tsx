"use client"

import { useCallback, useEffect, useState } from "react"
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { BaseLayout } from "@/components/layouts/base-layout"
import { deletePartner, listPartners } from "@/api/partners"
import { getErrorMessage } from "@/api/axios"
import { useAuthStore } from "@/store/authStore"
import type { Partner } from "@/types/partner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { PartnerFormDialog } from "./components/partner-form-dialog"

export default function PartnersManagePage() {
  const { t } = useTranslation()
  const isAdmin = useAuthStore((s) => s.member?.role) === "ADMIN"

  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Partner | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null)
  const [deleting, setDeleting] = useState(false)

  /** Fetches the partner list and stores it, surfacing errors as a toast. */
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listPartners()
      setPartners(result)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  /** Opens the form dialog in create mode. */
  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  /**
   * Opens the form dialog in edit mode for the given partner.
   *
   * @param partner the partner to edit
   */
  function openEdit(partner: Partner) {
    setEditing(partner)
    setFormOpen(true)
  }

  /** Deletes the partner held in deleteTarget, then refreshes the list. */
  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deletePartner(deleteTarget.id)
      toast.success(t("partnersManage.toast.deleted"))
      setDeleteTarget(null)
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <BaseLayout title={t("partnersManage.title")} description={t("partnersManage.description")}>
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-muted-foreground text-sm">
            {t("partnersManage.total", { count: partners.length })}
          </span>
          <Button onClick={openCreate}>
            <Plus />
            {t("partnersManage.addPartner")}
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">{t("partnersManage.table.logo")}</TableHead>
                  <TableHead>{t("partnersManage.table.name")}</TableHead>
                  <TableHead>{t("partnersManage.table.website")}</TableHead>
                  <TableHead>{t("partnersManage.table.displayOrder")}</TableHead>
                  <TableHead className="w-px pr-4 text-center whitespace-nowrap">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-10 text-center">
                      {t("partnersManage.loading")}
                    </TableCell>
                  </TableRow>
                ) : partners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-10 text-center">
                      {t("partnersManage.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  partners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell className="pl-4">
                        <div className="bg-muted flex size-12 items-center justify-center overflow-hidden rounded-md border">
                          <img src={partner.logoUrl} alt="" className="h-full w-full object-contain p-1" />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{partner.name}</TableCell>
                      <TableCell>
                        {partner.websiteUrl ? (
                          <a
                            href={partner.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary inline-flex items-center gap-1 hover:underline"
                          >
                            {t("partnersManage.table.visit")}
                            <ExternalLink className="size-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{partner.displayOrder ?? "—"}</TableCell>
                      <TableCell className="pr-4">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t("partnersManage.edit")}
                            onClick={() => openEdit(partner)}
                          >
                            <Pencil />
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title={t("partnersManage.delete")}
                              onClick={() => setDeleteTarget(partner)}
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
      </div>

      <PartnerFormDialog open={formOpen} onOpenChange={setFormOpen} partner={editing} onSaved={load} />

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("partnersManage.deleteDialog.title")}</DialogTitle>
            <DialogDescription>{t("partnersManage.deleteDialog.description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t("partnersManage.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? t("partnersManage.deleteDialog.deleting") : t("partnersManage.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BaseLayout>
  )
}
