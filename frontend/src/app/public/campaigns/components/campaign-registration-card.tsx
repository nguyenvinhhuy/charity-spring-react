"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
  const queryClient = useQueryClient()
  const queryKey = ["registrations", "summary", campaignId]

  /** Registers the current member, optimistically bumping the count, then notifies the cancel cutoff. */
  const registerMutation = useMutation({
    mutationFn: () => registerForCampaign(campaignId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<RegistrationSummary>(queryKey)
      if (previous) {
        queryClient.setQueryData<RegistrationSummary>(queryKey, {
          ...previous,
          registeredCount: previous.registeredCount + 1,
          isRegistered: true,
        })
      }
      return { previous }
    },
    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
      toast.error(getErrorMessage(err))
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKey, updated)
      toast.success(t("registrations.registerSuccess", { date: cancelCutoffDate(eventStartDate) }))
    },
  })

  /** Cancels the current member's own registration, optimistically dropping the count. */
  const cancelMutation = useMutation({
    mutationFn: async () => {
      await cancelRegistration(campaignId)
      return getRegistrationSummary(campaignId)
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<RegistrationSummary>(queryKey)
      if (previous) {
        queryClient.setQueryData<RegistrationSummary>(queryKey, {
          ...previous,
          registeredCount: Math.max(0, previous.registeredCount - 1),
          isRegistered: false,
        })
      }
      return { previous }
    },
    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
      toast.error(getErrorMessage(err))
    },
    onSuccess: (refreshed) => {
      queryClient.setQueryData(queryKey, refreshed)
    },
  })

  const { data: summary } = useQuery({
    queryKey,
    queryFn: () => getRegistrationSummary(campaignId),
    // Non-critical decorative section: fail silently, just don't render the card.
    meta: { silent: true },
    // Paused while register/cancel is in flight so the poll can't clobber its optimistic update.
    refetchInterval: () => (registerMutation.isPending || cancelMutation.isPending ? false : POLL_INTERVAL_MS),
  })

  if (!summary) return null

  const isFull = !summary.isRegistered && summary.registeredCount >= capacity
  const pending = registerMutation.isPending || cancelMutation.isPending

  function handleRegister() {
    if (!member) {
      toast.error(t("registrations.loginPrompt"))
      return
    }
    if (pending || isFull) return
    registerMutation.mutate()
  }

  function handleCancel() {
    if (pending) return
    cancelMutation.mutate()
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
