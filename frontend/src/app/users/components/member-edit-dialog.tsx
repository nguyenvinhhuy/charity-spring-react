"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Lock } from "lucide-react"
import { setMemberActive, updateMemberRole, updateTeamProfile } from "@/api/members"
import { getErrorMessage } from "@/api/axios"
import { colorOf, initialsOf } from "@/lib/avatar"
import type { Role } from "@/types/common"
import type { Member } from "@/types/member"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const ROLE_OPTIONS: Role[] = ["ADMIN", "CONTRIBUTOR", "MEMBER"]

interface MemberEditDialogProps {
  member: Member | null
  /** True when the member being edited is the currently signed-in admin (role/active are locked). */
  isSelf: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void | Promise<void>
}

/**
 * Consolidated dialog for editing everything an ADMIN can change about a member: role, active
 * status, and public team-display fields — one popup instead of separate row actions.
 *
 * @param member the member being edited, or null when the dialog is closed
 * @param isSelf whether the member is the signed-in admin themselves
 * @param onOpenChange invoked when the dialog's open state should change
 * @param onSaved invoked after a successful save
 */
export function MemberEditDialog({ member, isSelf, onOpenChange, onSaved }: MemberEditDialogProps) {
  const { t } = useTranslation()
  const [role, setRole] = useState<Role>("MEMBER")
  const [active, setActive] = useState(true)
  const [leadershipTitle, setLeadershipTitle] = useState("")
  const [teamDisplayOrder, setTeamDisplayOrder] = useState("")

  // Resets the fields the moment a (possibly different) member is opened for editing, computed
  // during render instead of an effect so React doesn't paint the stale values first.
  const [lastMemberId, setLastMemberId] = useState<number | null>(null)
  if (member && member.id !== lastMemberId) {
    setLastMemberId(member.id)
    setRole(member.role)
    setActive(member.isActive)
    setLeadershipTitle(member.leadershipTitle ?? "")
    setTeamDisplayOrder(member.teamDisplayOrder != null ? String(member.teamDisplayOrder) : "")
  }

  const saveMutation = useMutation({
    /** Saves only the fields that changed against the member snapshot the dialog was opened with. */
    mutationFn: async () => {
      if (!member) return
      if (role !== member.role) {
        await updateMemberRole(member.id, role)
      }
      if (active !== member.isActive) {
        await setMemberActive(member.id, active)
      }
      const newLeadershipTitle = leadershipTitle.trim() ? leadershipTitle.trim() : null
      const newTeamDisplayOrder = teamDisplayOrder.trim() ? Number(teamDisplayOrder) : null
      if (newLeadershipTitle !== member.leadershipTitle || newTeamDisplayOrder !== member.teamDisplayOrder) {
        await updateTeamProfile(member.id, {
          leadershipTitle: newLeadershipTitle,
          teamDisplayOrder: newTeamDisplayOrder,
        })
      }
    },
    // Awaits the refetch before closing so the table behind it never briefly shows stale data.
    onSuccess: async () => {
      toast.success(t("users.editDialog.saved"))
      await onSaved()
      onOpenChange(false)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <Dialog open={member !== null} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="items-center gap-2 border-b-2 border-slate-200 px-6 pt-6 pb-5 text-center sm:text-center dark:border-slate-700">
          {member && (
            <Avatar className="ring-background size-14 shadow-md ring-4">
              <AvatarImage src={member.avatarUrl ?? undefined} />
              <AvatarFallback className={`font-semibold ${colorOf(member.fullName)}`}>
                {initialsOf(member.fullName)}
              </AvatarFallback>
            </Avatar>
          )}
          <DialogTitle className="text-xl">{member?.fullName}</DialogTitle>
          {member && <DialogDescription className="text-foreground/70">{member.email}</DialogDescription>}
        </DialogHeader>

        <div className="px-6 pb-6">
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="mb-2 text-sm font-semibold">{t("users.editDialog.accountSection")}</h3>
              <div className="divide-y-2 divide-slate-200 overflow-hidden rounded-lg border-2 border-slate-200 shadow-sm dark:divide-slate-700 dark:border-slate-700">
                <div className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <Label htmlFor="member-role">{t("users.editDialog.roleLabel")}</Label>
                    <p className="text-foreground/70 mt-0.5 flex items-center gap-1 text-sm">
                      {isSelf && <Lock className="size-3 shrink-0" />}
                      {isSelf ? t("users.editDialog.selfRoleLocked") : t("users.editDialog.roleHint")}
                    </p>
                  </div>
                  <Select value={role} onValueChange={(value) => setRole(value as Role)} disabled={isSelf}>
                    <SelectTrigger id="member-role" className="w-36 shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {t(`role.${option}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <Label htmlFor="member-active">{t("users.editDialog.activeLabel")}</Label>
                    <p className="text-foreground/70 mt-0.5 flex items-center gap-1 text-sm">
                      {isSelf && <Lock className="size-3 shrink-0" />}
                      {isSelf ? t("users.editDialog.selfActiveLocked") : t("users.editDialog.activeHint")}
                    </p>
                  </div>
                  <Switch
                    id="member-active"
                    checked={active}
                    onCheckedChange={setActive}
                    disabled={isSelf}
                    className="data-[state=unchecked]:bg-slate-400 disabled:opacity-100 dark:data-[state=unchecked]:bg-slate-600"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">{t("users.editDialog.teamSection")}</h3>
              <div className="divide-y-2 divide-slate-200 overflow-hidden rounded-lg border-2 border-slate-200 shadow-sm dark:divide-slate-700 dark:border-slate-700">
                <div className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <Label htmlFor="leadership-title">{t("users.editDialog.leadershipTitleLabel")}</Label>
                    <p className="text-foreground/70 mt-0.5 text-sm">{t("users.editDialog.leadershipTitleHint")}</p>
                  </div>
                  <Input
                    id="leadership-title"
                    className="w-36 shrink-0"
                    value={leadershipTitle}
                    onChange={(e) => setLeadershipTitle(e.target.value)}
                    placeholder={t("users.editDialog.leadershipTitlePlaceholder")}
                    maxLength={100}
                  />
                </div>

                <div className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <Label htmlFor="team-display-order">{t("users.editDialog.displayOrderLabel")}</Label>
                    <p className="text-foreground/70 mt-0.5 text-sm">{t("users.editDialog.displayOrderHint")}</p>
                  </div>
                  <Input
                    id="team-display-order"
                    className="w-36 shrink-0"
                    type="number"
                    value={teamDisplayOrder}
                    onChange={(e) => setTeamDisplayOrder(e.target.value)}
                    placeholder={t("users.editDialog.displayOrderPlaceholder")}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("users.editDialog.cancel")}
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? t("users.editDialog.saving") : t("users.editDialog.save")}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
