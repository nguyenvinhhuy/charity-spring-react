"use client"

import { useCallback, useEffect, useState } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { addDonation, deleteDonation, listDonations } from "@/api/donations"
import { getErrorMessage } from "@/api/axios"
import type { CampaignSummary } from "@/types/campaign"
import type { Donation } from "@/types/donation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { formatVnd } from "./campaign-constants"

interface DonationsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign: CampaignSummary | null
  /** Called after any change so the parent can refresh the campaign totals. */
  onChanged: () => void
}

/** Returns today's date as a yyyy-MM-dd string for the date input default. */
function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Dialog to record and manage a campaign's donation ledger (admin only).
 *
 * @param open whether the dialog is visible
 * @param onOpenChange invoked when the dialog's open state should change
 * @param campaign the campaign whose donations are being managed
 * @param onChanged invoked after any change so the parent can refresh the campaign totals
 */
export function DonationsDialog({ open, onOpenChange, campaign, onChanged }: DonationsDialogProps) {
  const { t } = useTranslation()
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState("")
  const [donorName, setDonorName] = useState("")
  const [donatedAt, setDonatedAt] = useState(today())
  const [saving, setSaving] = useState(false)

  const campaignId = campaign?.id ?? null

  /** Loads the campaign's donations into local state. */
  const load = useCallback(async () => {
    if (campaignId == null) return
    setLoading(true)
    try {
      const page = await listDonations(campaignId, { size: 50 })
      setDonations(page.content)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  useEffect(() => {
    if (open) {
      setAmount("")
      setDonorName("")
      setDonatedAt(today())
      void load()
    }
  }, [open, load])

  /** Records a new donation, then refreshes the list and the parent totals. */
  async function handleAdd() {
    if (campaignId == null) return
    if (Number(amount) <= 0) {
      toast.error(t("campaigns.donations.amountMustBePositive"))
      return
    }
    setSaving(true)
    try {
      await addDonation(campaignId, {
        amount: Number(amount),
        donorName: donorName.trim() ? donorName.trim() : null,
        donatedAt,
        note: null,
      })
      toast.success(t("campaigns.donations.added"))
      setAmount("")
      setDonorName("")
      await load()
      onChanged()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  /**
   * Deletes a donation, then refreshes the list and the parent totals.
   *
   * @param id the donation's id
   */
  async function handleDelete(id: number) {
    if (campaignId == null) return
    try {
      await deleteDonation(campaignId, id)
      toast.success(t("campaigns.donations.deleted"))
      await load()
      onChanged()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const total = donations.reduce((sum, d) => sum + d.amount, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("campaigns.donations.title")}</DialogTitle>
          <DialogDescription>{campaign?.title}</DialogDescription>
        </DialogHeader>

        {/* Add form */}
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="don-amount">{t("campaigns.donations.amountLabel")}</Label>
            <Input
              id="don-amount"
              type="number"
              min={0}
              step={1000}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="don-donor">{t("campaigns.donations.donorLabel")}</Label>
            <Input
              id="don-donor"
              value={donorName}
              placeholder={t("campaigns.donations.anonymous")}
              onChange={(e) => setDonorName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="don-date">{t("campaigns.donations.dateLabel")}</Label>
            <Input
              id="don-date"
              type="date"
              value={donatedAt}
              onChange={(e) => setDonatedAt(e.target.value)}
            />
          </div>
          <Button type="button" onClick={handleAdd} disabled={saving}>
            {saving ? t("campaigns.donations.adding") : t("campaigns.donations.addButton")}
          </Button>
        </div>

        <div className="text-muted-foreground text-sm">
          {t("campaigns.donations.totalRecorded")}{" "}
          <span className="text-foreground font-medium">{formatVnd(total)}</span>
          {" · "}
          {t("campaigns.donations.count", { count: donations.length })}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">{t("campaigns.donations.tableDate")}</TableHead>
                <TableHead>{t("campaigns.donations.tableDonor")}</TableHead>
                <TableHead className="text-right">{t("campaigns.donations.tableAmount")}</TableHead>
                <TableHead className="w-px pr-4 text-center whitespace-nowrap">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                    {t("common.loading")}
                  </TableCell>
                </TableRow>
              ) : donations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                    {t("campaigns.donations.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                donations.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="pl-4">{new Date(d.donatedAt).toLocaleDateString("vi-VN")}</TableCell>
                    <TableCell>{d.donorName ?? t("campaigns.donations.anonymous")}</TableCell>
                    <TableCell className="text-right font-medium">{formatVnd(d.amount)}</TableCell>
                    <TableCell className="pr-4 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(d.id)}
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

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
