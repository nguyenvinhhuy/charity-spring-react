"use client"

import { useCallback, useEffect, useRef, useState } from "react"
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
import type { AppNotification } from "@/types/notification"

const PAGE_SIZE = 20
const VISIBLE_ROWS_HEIGHT = "22rem"

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
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [broadcastTitle, setBroadcastTitle] = useState("")
  const [broadcastMessage, setBroadcastMessage] = useState("")
  const [sendingBroadcast, setSendingBroadcast] = useState(false)

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

  useNotificationStream(
    !!member,
    useCallback(
      (n: AppNotification) => {
        incrementUnread()
        toast(messageFor(n))
        if (open) {
          setNotifications((prev) => [n, ...prev])
        }
      },
      [incrementUnread, messageFor, open],
    ),
  )

  const loadFirstPage = useCallback(() => {
    setLoading(true)
    listNotifications({ page: 0, size: PAGE_SIZE })
      .then((res) => {
        setNotifications(res.content)
        setPage(0)
        setHasMore(!res.last)
      })
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (open) loadFirstPage()
  }, [open, loadFirstPage])

  function loadMore() {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    listNotifications({ page: nextPage, size: PAGE_SIZE })
      .then((res) => {
        setNotifications((prev) => [...prev, ...res.content])
        setPage(nextPage)
        setHasMore(!res.last)
      })
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoadingMore(false))
  }

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
      loadMore()
    }
  }

  function handleRowClick(n: AppNotification) {
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      decrementUnread()
      markNotificationRead(n.id).catch(() => {
        // Best-effort: the row already shows as read locally.
      })
    }
    setOpen(false)
  }

  function handleDelete(id: number, wasUnread: boolean) {
    setNotifications((prev) => prev.filter((x) => x.id !== id))
    if (wasUnread) decrementUnread()
    deleteNotification(id).catch((error) => toast.error(getErrorMessage(error)))
  }

  function handleMarkAllRead() {
    const unread = notifications.filter((n) => !n.read).length
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    if (unread > 0) decrementUnread(unread)
    markAllNotificationsRead().catch((error) => toast.error(getErrorMessage(error)))
  }

  function handleSendBroadcast() {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return
    setSendingBroadcast(true)
    broadcastNotification({ title: broadcastTitle, message: broadcastMessage })
      .then(() => {
        toast.success(t("notifications.broadcastSent"))
        setBroadcastOpen(false)
        setBroadcastTitle("")
        setBroadcastMessage("")
      })
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setSendingBroadcast(false))
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
                  <Button variant="ghost" size="icon" className="size-7 cursor-pointer" aria-label={t("notifications.sendBroadcast")}>
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
                    <Button onClick={handleSendBroadcast} disabled={sendingBroadcast}>
                      {sendingBroadcast && <Loader2 className="animate-spin" />}
                      {t("notifications.send")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {notifications.some((n) => !n.read) && (
              <Button variant="ghost" size="icon" className="size-7 cursor-pointer" onClick={handleMarkAllRead} aria-label={t("notifications.markAllRead")}>
                <Check className="size-4" />
              </Button>
            )}
          </div>
        </div>
        <Separator />
        <div ref={scrollRef} onScroll={handleScroll} className="overflow-y-auto" style={{ maxHeight: VISIBLE_ROWS_HEIGHT }}>
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
