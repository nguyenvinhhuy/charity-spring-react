"use client"

import { useCallback, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Pencil, Search, UserCheck, UserX } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { BaseLayout } from "@/components/layouts/base-layout"
import { listMembers, setMemberActive, updateMemberRole } from "@/api/members"
import { getErrorMessage } from "@/api/axios"
import { useAuthStore } from "@/store/authStore"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import type { Member, Page, Role } from "@/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CreateMemberDialog } from "./components/create-member-dialog"

const PAGE_SIZE = 10
const ALL = "ALL"

const ROLE_OPTIONS: Role[] = ["ADMIN", "CONTRIBUTOR", "MEMBER"]

/** Tailwind classes giving each role a distinct, readable badge color. */
const ROLE_BADGE_CLASSES: Record<Role, string> = {
  ADMIN: "border-transparent bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  CONTRIBUTOR: "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  MEMBER: "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
}

const STATUS_BADGE_ACTIVE = "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
const STATUS_BADGE_INACTIVE = "border-transparent bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400"

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
  const [data, setData] = useState<Page<Member> | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search)
  const [roleFilter, setRoleFilter] = useState<Role | typeof ALL>(ALL)
  const [statusFilter, setStatusFilter] = useState<"true" | "false" | typeof ALL>(ALL)

  /** Fetches the current page of members and stores it, surfacing errors as a toast. */
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listMembers({
        page,
        size: PAGE_SIZE,
        search: debouncedSearch || undefined,
        role: roleFilter === ALL ? undefined : roleFilter,
        active: statusFilter === ALL ? undefined : statusFilter === "true",
      })
      setData(result)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, roleFilter, statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  /**
   * Changes a member's role, then refreshes the list.
   *
   * @param id the member id
   * @param role the new role
   */
  async function handleRoleChange(id: number, role: Role) {
    try {
      await updateMemberRole(id, role)
      toast.success(t("users.roleUpdated"))
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  /**
   * Toggles a member's active status, then refreshes the list.
   *
   * @param id the member id
   * @param active the desired active state
   */
  async function handleActiveChange(id: number, active: boolean) {
    try {
      await setMemberActive(id, active)
      toast.success(active ? t("users.activated") : t("users.deactivated"))
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const members = data?.content ?? []

  return (
    <BaseLayout
      title={t("users.title")}
      description={t("users.description")}
    >
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
              {t("users.totalCount", { count: data?.totalElements ?? 0 })}
            </p>
          </div>
          <CreateMemberDialog onCreated={load} />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("users.table.member")}</TableHead>
                  <TableHead>{t("users.table.role")}</TableHead>
                  <TableHead>{t("users.table.status")}</TableHead>
                  <TableHead>{t("users.table.phone")}</TableHead>
                  <TableHead>{t("users.table.createdAt")}</TableHead>
                  <TableHead className="text-right">{t("users.table.actions")}</TableHead>
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
                    const isSelf = member.id === currentMember?.id
                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={member.avatarUrl ?? undefined} />
                              <AvatarFallback>{initial(member.fullName)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">{member.fullName}</span>
                              <span className="text-muted-foreground text-sm">
                                {member.email}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={ROLE_BADGE_CLASSES[member.role]}>
                            {t(`role.${member.role}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={member.isActive ? STATUS_BADGE_ACTIVE : STATUS_BADGE_INACTIVE}>
                            {member.isActive ? t("users.statusActive") : t("users.statusInactive")}
                          </Badge>
                        </TableCell>
                        <TableCell>{member.phone ?? "—"}</TableCell>
                        <TableCell>{formatDate(member.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                  disabled={isSelf}
                                  title={t("users.changeRole")}
                                >
                                  <Pencil />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {ROLE_OPTIONS.map((role) => (
                                  <DropdownMenuItem
                                    key={role}
                                    disabled={role === member.role}
                                    onClick={() => handleRoleChange(member.id, role)}
                                  >
                                    {t(`role.${role}`)}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              disabled={isSelf}
                              title={member.isActive ? t("users.deactivate") : t("users.activate")}
                              onClick={() => handleActiveChange(member.id, !member.isActive)}
                            >
                              {member.isActive ? (
                                <UserX className="text-red-600 dark:text-red-400" />
                              ) : (
                                <UserCheck className="text-emerald-600 dark:text-emerald-400" />
                              )}
                            </Button>
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
            {t("users.pagination", { current: (data?.number ?? 0) + 1, total: data?.totalPages ?? 1 })}
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
    </BaseLayout>
  )
}
