"use client"

import { useCallback, useEffect, useState } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { listRegistrants, removeRegistrant } from "@/api/registrations"
import { getErrorMessage } from "@/api/axios"
import type { CampaignSummary, Registrant } from "@/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface RegistrationsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign: CampaignSummary | null
}

/**
 * Dialog to view and moderate a campaign's event registrant roster (admin/contributor only).
 * Registration itself is member self-service (the public detail page); this dialog only lists
 * and force-removes, it has no "add" form.
 *
 * @param open whether the dialog is visible
 * @param onOpenChange invoked when the dialog's open state should change
 * @param campaign the campaign whose registrants to manage
 */
export function RegistrationsDialog({ open, onOpenChange, campaign }: RegistrationsDialogProps) {
  const { t } = useTranslation()
  const [registrants, setRegistrants] = useState<Registrant[]>([])
  const [loading, setLoading] = useState(false)

  const campaignId = campaign?.id ?? null

  /** Loads the campaign's registrants into local state. */
  const load = useCallback(async () => {
    if (campaignId == null) return
    setLoading(true)
    try {
      const page = await listRegistrants(campaignId, { size: 100 })
      setRegistrants(page.content)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  useEffect(() => {
    if (open) {
      void load()
    }
  }, [open, load])

  /**
   * Force-removes a registrant, then refreshes the list.
   *
   * @param memberId the registrant's member id
   */
  async function handleRemove(memberId: number) {
    if (campaignId == null) return
    try {
      await removeRegistrant(campaignId, memberId)
      toast.success(t("campaigns.registrations.removed"))
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("campaigns.registrations.title")}</DialogTitle>
          <DialogDescription>{campaign?.title}</DialogDescription>
        </DialogHeader>

        <div className="text-muted-foreground text-sm">
          {t("campaigns.registrations.count", { count: registrants.length })}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("campaigns.registrations.tableName")}</TableHead>
                <TableHead>{t("campaigns.registrations.tableRegisteredAt")}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground py-8 text-center">
                    {t("common.loading")}
                  </TableCell>
                </TableRow>
              ) : registrants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground py-8 text-center">
                    {t("campaigns.registrations.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                registrants.map((r) => (
                  <TableRow key={r.memberId}>
                    <TableCell>{r.memberName}</TableCell>
                    <TableCell>{new Date(r.registeredAt).toLocaleString("vi-VN")}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(r.memberId)}
                        aria-label={t("common.delete")}
                      >
                        <Trash2 className="text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
