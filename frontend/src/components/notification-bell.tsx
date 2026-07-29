"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { type InfiniteData, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { formatDistanceToNow } from "date-fns"
import { vi as viLocale, enUS } from "date-fns/locale"
import { Bell, Check, Loader2, Megaphone, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/store/authStore"
import { useNotificationStore } from "@/store/notificationStore"
import { useNotificationStream } from "@/hooks/use-notification-stream"
import {
  broadcastNotification,
  deleteNotification,
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/api/notifications"
import { getErrorMessage } from "@/api/axios"
import type { Page } from "@/types/common"
import type { AppNotification } from "@/types/notification"

const PAGE_SIZE = 20
const VISIBLE_ROWS_HEIGHT = "22rem"
const NOTIFICATIONS_QUERY_KEY = ["notifications"]

function referenceHref(n: AppNotification): string | null {
  switch (n.referenceType) {
    case "CAMPAIGN":
      return n.type === "COMMENT_MENTION" ? "/campaigns" : "/dashboard/campaigns"
    case "POST":
      return "/news"
    case "INQUIRY":
      return "/dashboard/inquiries"
    default:
      return null
  }
}

/** Renders the small round icon-only bell button used both as popover/dialog trigger and standalone. */
export function NotificationBell() {
  const { t, i18n } = useTranslation()
  const member = useAuthStore((s) => s.member)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount)
  const incrementUnread = useNotificationStore((s) => s.incrementUnread)
  const decrementUnread = useNotificationStore((s) => s.decrementUnread)

  const [open, setOpen] = useState(false)
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [broadcastTitle, setBroadcastTitle] = useState("")
  const [broadcastMessage, setBroadcastMessage] = useState("")
  const queryClient = useQueryClient()

  const scrollRef = useRef<HTMLDivElement>(null)
  const dateLocale = i18n.language.startsWith("vi") ? viLocale : enUS

  const isAdmin = member?.role === "ADMIN"

  const messageFor = useCallback(
    (n: AppNotification): string => {
      if (n.type === "BROADCAST") return n.message ?? ""
      const actor = n.actorName ?? t("notifications.someone")
      const title = n.referenceTitle ?? ""
      switch (n.type) {
        case "COMMENT_MENTION":
          return t("notifications.types.COMMENT_MENTION", { actor })
        case "CAMPAIGN_STATUS_CHANGED":
          return t("notifications.types.CAMPAIGN_STATUS_CHANGED", {
            title,
            status: n.detail ? t(`campaigns.status.${n.detail}`) : "",
          })
        case "REGISTRATION_CREATED":
          return t("notifications.types.REGISTRATION_CREATED", { actor, title })
        case "REGISTRATION_CANCELLED":
          return t("notifications.types.REGISTRATION_CANCELLED", { actor, title })
        case "REGISTRATION_REMOVED":
          return t("notifications.types.REGISTRATION_REMOVED", { title })
        case "DONATION_RECEIVED":
          return t("notifications.types.DONATION_RECEIVED", { actor, title })
        case "INQUIRY_RECEIVED":
          return t("notifications.types.INQUIRY_RECEIVED", { actor, title })
        default:
          return ""
      }
    },
    [t],
  )

  useEffect(() => {
    if (!member) return
    getUnreadCount()
      .then(setUnreadCount)
      .catch(() => {
        // Non-critical: the badge just won't show an initial count.
      })
  }, [member, setUnreadCount])

  /** Applies `updater` to every fetched page's content, e.g. to mark a row read or drop it locally. */
  const updateNotificationPages = useCallback(
    (updater: (content: AppNotification[]) => AppNotification[]) => {
      queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, (old?: InfiniteData<Page<AppNotification>>) =>
        old ? { ...old, pages: old.pages.map((p) => ({ ...p, content: updater(p.content) })) } : old,
      )
    },
    [queryClient],
  )

  useNotificationStream(
    !!member,
    useCallback(
      (n: AppNotification) => {
        incrementUnread()
        toast(messageFor(n))
        if (open) {
          updateNotificationPages((content) => [n, ...content])
        }
      },
      [incrementUnread, messageFor, open, updateNotificationPages],
    ),
  )

  const {
    data: notificationsPages,
    isLoading: loading,
    isFetchingNextPage: loadingMore,
    hasNextPage: hasMore,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: ({ pageParam }) => listNotifications({ page: pageParam, size: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => (lastPage.last ? undefined : allPages.length),
    enabled: open,
  })
  const notifications = useMemo(() => notificationsPages?.pages.flatMap((p) => p.content) ?? [], [notificationsPages])

  function loadMore() {
    if (loadingMore || !hasMore) return
    void fetchNextPage()
  }

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
      loadMore()
    }
  }

  const markReadMutation = useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteNotification(id),
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const broadcastMutation = useMutation({
    mutationFn: (payload: { title: string; message: string }) => broadcastNotification(payload),
    onSuccess: () => {
      toast.success(t("notifications.broadcastSent"))
      setBroadcastOpen(false)
      setBroadcastTitle("")
      setBroadcastMessage("")
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  function handleRowClick(n: AppNotification) {
    if (!n.read) {
      updateNotificationPages((content) => content.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      decrementUnread()
      // Best-effort: the row already shows as read locally regardless of the request's outcome.
      markReadMutation.mutate(n.id)
    }
    setOpen(false)
  }

  function handleDelete(id: number, wasUnread: boolean) {
    updateNotificationPages((content) => content.filter((x) => x.id !== id))
    if (wasUnread) decrementUnread()
    deleteMutation.mutate(id)
  }

  function handleMarkAllRead() {
    const unread = notifications.filter((n) => !n.read).length
    updateNotificationPages((content) => content.map((n) => ({ ...n, read: true })))
    if (unread > 0) decrementUnread(unread)
    markAllReadMutation.mutate()
  }

  function handleSendBroadcast() {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return
    broadcastMutation.mutate({ title: broadcastTitle, message: broadcastMessage })
  }

  if (!member) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative cursor-pointer" aria-label={t("notifications.title")}>
          <Bell />
          {unreadCount > 0 && (
            <span className="bg-destructive text-destructive-foreground absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between gap-2 p-3">
          <h3 className="text-sm font-semibold">{t("notifications.title")}</h3>
          <div className="flex items-center gap-1">
            {isAdmin && (
              <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 cursor-pointer"
                    aria-label={t("notifications.sendBroadcast")}
                  >
                    <Megaphone className="size-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("notifications.sendBroadcast")}</DialogTitle>
                    <DialogDescription>{t("notifications.sendBroadcastDesc")}</DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-3">
                    <Input
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder={t("notifications.broadcastTitlePlaceholder")}
                      maxLength={200}
                    />
                    <Textarea
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder={t("notifications.broadcastMessagePlaceholder")}
                      rows={4}
                    />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">{t("common.cancel")}</Button>
                    </DialogClose>
                    <Button onClick={handleSendBroadcast} disabled={broadcastMutation.isPending}>
                      {broadcastMutation.isPending && <Loader2 className="animate-spin" />}
                      {t("notifications.send")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {notifications.some((n) => !n.read) && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 cursor-pointer"
                onClick={handleMarkAllRead}
                aria-label={t("notifications.markAllRead")}
              >
                <Check className="size-4" />
              </Button>
            )}
          </div>
        </div>
        <Separator />
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="overflow-y-auto"
          style={{ maxHeight: VISIBLE_ROWS_HEIGHT }}
        >
          {loading ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 p-6 text-sm">
              <Loader2 className="size-4 animate-spin" />
              {t("common.loading")}
            </div>
          ) : notifications.length === 0 ? (
            <p className="text-muted-foreground p-6 text-center text-sm">{t("notifications.empty")}</p>
          ) : (
            <ul>
              {notifications.map((n) => {
                const href = referenceHref(n)
                const content = (
                  <div
                    className={`hover:bg-accent flex items-start gap-2.5 p-3 text-sm transition-colors ${
                      !n.read ? "bg-primary/5" : ""
                    }`}
                  >
                    {!n.read && <span className="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full" />}
                    <div className={`flex-1 ${n.read ? "pl-3.5" : ""}`}>
                      <p className={n.read ? "text-muted-foreground" : "font-medium"}>
                        {n.type === "BROADCAST" ? n.title : messageFor(n)}
                      </p>
                      {n.type === "BROADCAST" && n.message && (
                        <p className="text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      )}
                      <p className="text-muted-foreground mt-1 text-xs">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: dateLocale })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 shrink-0 cursor-pointer"
                      aria-label={t("common.delete")}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDelete(n.id, !n.read)
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                )
                return (
                  <li key={n.id} className="border-b last:border-b-0">
                    {href ? (
                      <Link to={href} onClick={() => handleRowClick(n)}>
                        {content}
                      </Link>
                    ) : (
                      <div onClick={() => handleRowClick(n)} className="cursor-pointer">
                        {content}
                      </div>
                    )}
                  </li>
                )
              })}
              {loadingMore && (
                <div className="flex items-center justify-center p-3">
                  <Loader2 className="text-muted-foreground size-4 animate-spin" />
                </div>
              )}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
