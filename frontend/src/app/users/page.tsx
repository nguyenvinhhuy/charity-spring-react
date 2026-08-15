"use client"

import { useState } from "react"
import { useMutation, keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, Search, Settings, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { BaseLayout } from "@/components/layouts/base-layout"
import { deleteMember, listMembers } from "@/api/members"
import { getErrorMessage } from "@/api/axios"
import { useAuthStore } from "@/store/authStore"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import type { Role } from "@/types/common"
import { isFirstPage, isLastPage } from "@/types/common"
import type { Member } from "@/types/member"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { CreateMemberDialog } from "./components/create-member-dialog"
import { MemberEditDialog } from "./components/member-edit-dialog"
import { ROLE_BADGE_CLASSES, STATUS_BADGE_ACTIVE, STATUS_BADGE_INACTIVE } from "./components/role-constants"

const PAGE_SIZE = 10
const ALL = "ALL"

const ROLE_OPTIONS: Role[] = ["ADMIN", "CONTRIBUTOR", "MEMBER"]

/**
 * Returns the first character of a name, upper-cased, for the avatar fallback.
 *
 * @param fullName the member's full name
 */
function initial(fullName: string): string {
  return fullName.trim().charAt(0).toUpperCase() || "?"
}

/**
 * Formats an ISO date string as a Vietnamese short date.
 *
 * @param iso the ISO date string
 */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN")
}

/** Renders the user management page: a paginated table of members with role and status controls. */
export default function UsersPage() {
  const { t } = useTranslation()
  const currentMember = useAuthStore((s) => s.member)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search)
  const [roleFilter, setRoleFilter] = useState<Role | typeof ALL>(ALL)
  const [statusFilter, setStatusFilter] = useState<"true" | "false" | typeof ALL>(ALL)
  const [editTarget, setEditTarget] = useState<Member | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading: loading } = useQuery({
    queryKey: ["members", { page, debouncedSearch, roleFilter, statusFilter }],
    queryFn: () =>
      listMembers({
        page,
        size: PAGE_SIZE,
        search: debouncedSearch || undefined,
        role: roleFilter === ALL ? undefined : roleFilter,
        active: statusFilter === ALL ? undefined : statusFilter === "true",
      }),
    // Keeps the previous page/filter's rows on screen while the next one loads.
    placeholderData: keepPreviousData,
  })

  /** Refetches every members list query, regardless of the current page/filters. */
  function refreshMembers() {
    return queryClient.invalidateQueries({ queryKey: ["members"] })
  }

  const members = data?.content ?? []

  const deleteMutation = useMutation({
    mutationFn: (member: Member) => deleteMember(member.id),
    onSuccess: async () => {
      toast.success(t("users.deleteToastSuccess"))
      await refreshMembers()
      setDeleteTarget(null)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <BaseLayout title={t("users.title")} description={t("users.description")}>
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
                placeholder={t("users.searchPlaceholder")}
                className="w-64 pl-9"
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(value) => {
                setRoleFilter(value as Role | typeof ALL)
                setPage(0)
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("users.allRoles")}</SelectItem>
                {ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role} value={role}>
                    {t(`role.${role}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as "true" | "false" | typeof ALL)
                setPage(0)
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("users.allStatuses")}</SelectItem>
                <SelectItem value="true">{t("users.statusActive")}</SelectItem>
                <SelectItem value="false">{t("users.statusInactive")}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-sm">
              {t("users.totalCount", { count: data?.page.totalElements ?? 0 })}
            </p>
          </div>
          <CreateMemberDialog onCreated={refreshMembers} />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">{t("users.table.member")}</TableHead>
                  <TableHead>{t("users.table.role")}</TableHead>
                  <TableHead>{t("users.table.status")}</TableHead>
                  <TableHead>{t("users.table.phone")}</TableHead>
                  <TableHead>{t("users.table.createdAt")}</TableHead>
                  <TableHead className="w-px pr-4 text-center whitespace-nowrap">{t("users.table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground py-10 text-center">
                      {t("users.loading")}
                    </TableCell>
                  </TableRow>
                ) : members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground py-10 text-center">
                      {t("users.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member) => {
                    return (
                      <TableRow key={member.id}>
                        <TableCell className="pl-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={member.avatarUrl ?? undefined} />
                              <AvatarFallback>{initial(member.fullName)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">{member.fullName}</span>
                              <span className="text-muted-foreground text-sm">{member.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={ROLE_BADGE_CLASSES[member.role]}>{t(`role.${member.role}`)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={member.isActive ? STATUS_BADGE_ACTIVE : STATUS_BADGE_INACTIVE}>
                            {member.isActive ? t("users.statusActive") : t("users.statusInactive")}
                          </Badge>
                        </TableCell>
                        <TableCell>{member.phone ?? "—"}</TableCell>
                        <TableCell>{formatDate(member.createdAt)}</TableCell>
                        <TableCell className="pr-4">
                          <div className="flex items-center justify-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={t("users.editDialog.trigger")}
                                  onClick={() => setEditTarget(member)}
                                >
                                  <Settings />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t("users.editDialog.trigger")}</TooltipContent>
                            </Tooltip>
                            {!member.isActive && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={t("users.editDialog.deleteTrigger")}
                                    onClick={() => setDeleteTarget(member)}
                                  >
                                    <Trash2 className="text-destructive" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{t("users.editDialog.deleteTrigger")}</TooltipContent>
                              </Tooltip>
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
            {t("users.pagination", { current: (data?.page.number ?? 0) + 1, total: data?.page.totalPages ?? 1 })}
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

      <MemberEditDialog
        member={editTarget}
        isSelf={editTarget?.id === currentMember?.id}
        onOpenChange={(open) => !open && setEditTarget(null)}
        onSaved={refreshMembers}
      />

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("users.editDialog.deleteDialog.title")}</DialogTitle>
            <DialogDescription>{t("users.editDialog.deleteDialog.description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BaseLayout>
  )
}
