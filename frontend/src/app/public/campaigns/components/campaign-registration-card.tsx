"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { cancelRegistration, getRegistrationSummary, registerForCampaign } from "@/api/registrations"
import { getErrorMessage } from "@/api/axios"
import { useAuthStore } from "@/store/authStore"
import type { RegistrationSummary } from "@/types/registration"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

// No WebSocket/SSE infrastructure exists yet, so other viewers' registrations only surface via
// this periodic poll rather than instantly.
const POLL_INTERVAL_MS = 10_000

interface CampaignRegistrationCardProps {
  campaignId: number
  capacity: number
  eventStartDate: string
}

/** Formats an ISO date string as a Vietnamese short date. */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN")
}

/** Returns the last day a registration for this event may still be cancelled (1 day before it starts). */
function cancelCutoffDate(eventStartDate: string): string {
  const cutoff = new Date(eventStartDate)
  cutoff.setDate(cutoff.getDate() - 1)
  return formatDate(cutoff.toISOString())
}

/**
 * Renders a campaign's event-registration card: capacity progress plus a register/cancel button.
 * Only meant to be rendered when the campaign has a capacity set (see the caller in detail.tsx).
 *
 * @param campaignId the campaign id
 * @param capacity the campaign's max participant count
 * @param eventStartDate the campaign's event start date, used to compute the cancel cutoff
 */
export function CampaignRegistrationCard({ campaignId, capacity, eventStartDate }: CampaignRegistrationCardProps) {
  const { t } = useTranslation()
  const member = useAuthStore((s) => s.member)
  const [summary, setSummary] = useState<RegistrationSummary | null>(null)
  const [pending, setPending] = useState(false)
  const pendingRef = useRef(pending)

  useEffect(() => {
    pendingRef.current = pending
  }, [pending])

  useEffect(() => {
    let active = true

    function refresh() {
      // Skip while register/cancel is in flight so the poll can't clobber its optimistic update.
      if (pendingRef.current) return
      getRegistrationSummary(campaignId)
        .then((result) => {
          if (active) setSummary(result)
        })
        .catch(() => {
          // Non-critical decorative section: fail silently, just don't render the card.
        })
    }

    refresh()
    const intervalId = setInterval(refresh, POLL_INTERVAL_MS)
    return () => {
      active = false
      clearInterval(intervalId)
    }
  }, [campaignId])

  if (!summary) return null

  const isFull = !summary.isRegistered && summary.registeredCount >= capacity

  /** Registers the current member, optimistically bumping the count, then notifies the cancel cutoff. */
  async function handleRegister() {
    if (!member) {
      toast.error(t("registrations.loginPrompt"))
      return
    }
    if (pending || !summary || isFull) return

    const previous = summary
    setSummary({ ...summary, registeredCount: summary.registeredCount + 1, isRegistered: true })
    setPending(true)
    try {
      const updated = await registerForCampaign(campaignId)
      setSummary(updated)
      toast.success(t("registrations.registerSuccess", { date: cancelCutoffDate(eventStartDate) }))
    } catch (err) {
      setSummary(previous)
      toast.error(getErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  /** Cancels the current member's own registration, optimistically dropping the count. */
  async function handleCancel() {
    if (pending || !summary) return

    const previous = summary
    setSummary({ ...summary, registeredCount: Math.max(0, summary.registeredCount - 1), isRegistered: false })
    setPending(true)
    try {
      await cancelRegistration(campaignId)
      const refreshed = await getRegistrationSummary(campaignId)
      setSummary(refreshed)
    } catch (err) {
      setSummary(previous)
      toast.error(getErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("registrations.title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Progress value={(summary.registeredCount / capacity) * 100} />
        <span className="text-muted-foreground text-sm">
          {t("registrations.countLabel", { count: summary.registeredCount, capacity })}
        </span>

        {!member ? (
          <p className="text-muted-foreground text-sm">{t("registrations.loginPrompt")}</p>
        ) : summary.isRegistered ? (
          <Button variant="outline" disabled={pending || !summary.canCancel} onClick={handleCancel}>
            {t("registrations.cancelButton")}
          </Button>
        ) : (
          <Button disabled={pending || isFull} onClick={handleRegister}>
            {isFull ? t("registrations.full") : t("registrations.registerButton")}
          </Button>
        )}

        {member && summary.isRegistered && !summary.canCancel && (
          <p className="text-muted-foreground text-xs">{t("registrations.cancelClosedHint")}</p>
        )}
      </CardContent>
    </Card>
  )
}
