"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { SmilePlus } from "lucide-react"
import { getReactionSummary, removeReaction, setReaction, type ReactionTarget } from "@/api/reactions"
import { getErrorMessage } from "@/api/axios"
import { useAuthStore } from "@/store/authStore"
import type { ReactionSummary, ReactionType } from "@/types/reaction"
import { cn } from "@/lib/utils"
import { initialsOf, colorOf } from "@/lib/avatar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

const REACTION_EMOJI: Record<ReactionType, string> = {
  LIKE: "👍",
  LOVE: "❤️",
  CELEBRATE: "🎉",
  LAUGH: "😆",
  SURPRISED: "😮",
  SAD: "😢",
}

const REACTION_ORDER: ReactionType[] = ["LIKE", "LOVE", "CELEBRATE", "LAUGH", "SURPRISED", "SAD"]

// No WebSocket/SSE infrastructure exists yet, so other viewers' reactions only surface via this
// periodic poll rather than instantly.
const POLL_INTERVAL_MS = 10_000

interface ReactionBarProps {
  target: ReactionTarget
  targetId: number
}

/**
 * Renders a Teams-style reaction bar. With no reactions yet, only a single "add reaction" button
 * shows; once any type has been picked, a pill appears per active type (plus the add-reaction
 * button), and hovering a pill reveals a scrollable list of who reacted with that type.
 *
 * @param target the kind of content being reacted to
 * @param targetId the target's id
 */
export function ReactionBar({ target, targetId }: ReactionBarProps) {
  const { t } = useTranslation()
  // `member` is persisted across reloads, unlike the in-memory `isAuthenticated` flag which resets
  // on a hard page load until some other authenticated request re-hydrates it (see PublicLayout).
  const isAuthenticated = useAuthStore((s) => s.member !== null)
  const [summary, setSummary] = useState<ReactionSummary | null>(null)
  const [pending, setPending] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const pendingRef = useRef(pending)

  useEffect(() => {
    pendingRef.current = pending
  }, [pending])

  useEffect(() => {
    let active = true

    function refresh() {
      // Skip while a pick is in flight so the poll can't clobber its optimistic update.
      if (pendingRef.current) return
      getReactionSummary(target, targetId)
        .then((result) => {
          if (active) setSummary(result)
        })
        .catch(() => {
          // Non-critical decorative section: fail silently, just don't render reactions.
        })
    }

    refresh()
    const intervalId = setInterval(refresh, POLL_INTERVAL_MS)
    return () => {
      active = false
      clearInterval(intervalId)
    }
  }, [target, targetId])

  if (!summary) return null

  /** Sets, switches, or removes (if already picked) the caller's reaction, optimistically. */
  async function handlePick(type: ReactionType) {
    setPickerOpen(false)
    if (!isAuthenticated) {
      toast.error(t("reactions.loginPrompt"))
      return
    }
    if (pending || !summary) return

    const previous = summary
    const removing = summary.myReaction === type
    const nextCounts = { ...summary.counts }
    if (summary.myReaction) {
      nextCounts[summary.myReaction] = Math.max(0, (nextCounts[summary.myReaction] ?? 0) - 1)
    }
    if (!removing) {
      nextCounts[type] = (nextCounts[type] ?? 0) + 1
    }
    setSummary({
      ...summary,
      counts: nextCounts,
      myReaction: removing ? null : type,
      total: previous.total + (removing ? -1 : summary.myReaction ? 0 : 1),
    })

    setPending(true)
    try {
      if (removing) {
        await removeReaction(target, targetId)
      } else {
        await setReaction(target, targetId, type)
      }
      const refreshed = await getReactionSummary(target, targetId)
      setSummary(refreshed)
    } catch (err) {
      setSummary(previous)
      toast.error(getErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  const activeTypes = REACTION_ORDER.filter((type) => (summary.counts[type] ?? 0) > 0)

  return (
    <div className="flex flex-wrap items-center gap-2">
      {activeTypes.map((type) => {
        const count = summary.counts[type] ?? 0
        const names = summary.reactorNames[type] ?? []
        const isMine = summary.myReaction === type

        return (
          <HoverCard key={type} openDelay={150}>
            <HoverCardTrigger asChild>
              <button
                type="button"
                disabled={pending}
                onClick={() => handlePick(type)}
                className={cn(
                  "flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                  isMine ? "border-primary bg-primary/10" : "hover:bg-muted",
                )}
              >
                <span>{REACTION_EMOJI[type]}</span>
                <span className="text-muted-foreground text-xs">{count}</span>
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-56 p-0" align="start">
              <div className="border-b px-3 py-2 text-sm font-medium">{t(`reactions.types.${type}`)}</div>
              <div className="max-h-64 overflow-y-auto py-1">
                {names.map((name, index) => (
                  <div key={`${name}-${index}`} className="hover:bg-muted flex items-center gap-2 px-3 py-2">
                    <Avatar className="size-7">
                      <AvatarFallback className={colorOf(name)}>{initialsOf(name)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm">{name}</span>
                  </div>
                ))}
              </div>
            </HoverCardContent>
          </HoverCard>
        )
      })}

      <HoverCard open={pickerOpen} onOpenChange={setPickerOpen} openDelay={150} closeDelay={150}>
        <HoverCardTrigger asChild>
          <button
            type="button"
            aria-label={t("reactions.addReaction")}
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-8 cursor-pointer items-center justify-center rounded-full border transition-colors"
          >
            <SmilePlus className="size-4" />
          </button>
        </HoverCardTrigger>
        <HoverCardContent className="w-auto p-1.5" align="start">
          <div className="flex items-center gap-1">
            {REACTION_ORDER.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handlePick(type)}
                title={t(`reactions.types.${type}`)}
                className={cn(
                  "flex size-9 cursor-pointer items-center justify-center rounded-full text-lg transition-transform hover:scale-125 hover:bg-muted",
                  summary.myReaction === type && "bg-primary/10",
                )}
              >
                {REACTION_EMOJI[type]}
              </button>
            ))}
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  )
}
