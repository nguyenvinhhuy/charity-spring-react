"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { listRegistrants, removeRegistrant } from "@/api/registrations"
import { getErrorMessage } from "@/api/axios"
import type { CampaignSummary } from "@/types/campaign"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

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
  const queryClient = useQueryClient()
  const campaignId = campaign?.id ?? null

  const { data: registrantsPage, isLoading: loading } = useQuery({
    queryKey: ["registrants", campaignId],
    queryFn: () => listRegistrants(campaignId!, { size: 100 }),
    enabled: open && campaignId != null,
  })
  const registrants = registrantsPage?.content ?? []

  const removeMutation = useMutation({
    mutationFn: (memberId: number) => removeRegistrant(campaignId!, memberId),
    onSuccess: () => {
      toast.success(t("campaigns.registrations.removed"))
      void queryClient.invalidateQueries({ queryKey: ["registrants", campaignId] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

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
                <TableHead className="pl-4">{t("campaigns.registrations.tableName")}</TableHead>
                <TableHead>{t("campaigns.registrations.tableRegisteredAt")}</TableHead>
                <TableHead className="w-px pr-4 text-center whitespace-nowrap">{t("common.actions")}</TableHead>
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
                    <TableCell className="pl-4">{r.memberName}</TableCell>
                    <TableCell>{new Date(r.registeredAt).toLocaleString("vi-VN")}</TableCell>
                    <TableCell className="pr-4 text-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMutation.mutate(r.memberId)}
                            aria-label={t("common.delete")}
                          >
                            <Trash2 className="text-destructive" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("common.delete")}</TooltipContent>
                      </Tooltip>
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
