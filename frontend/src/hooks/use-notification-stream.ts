import { useEffect, useRef } from "react"
import { fetchEventSource } from "@microsoft/fetch-event-source"
import { API_BASE_URL } from "@/api/axios"
import { useAuthStore } from "@/store/authStore"
import type { AppNotification } from "@/types/notification"

/**
 * Opens a live SSE connection to the caller's notification stream while authenticated, invoking
 * `onNotification` for each new notification pushed by the server. Reconnects automatically.
 *
 * @param enabled whether to keep the connection open (e.g. only while the member is signed in)
 * @param onNotification called with each notification as it arrives
 */
export function useNotificationStream(enabled: boolean, onNotification: (notification: AppNotification) => void): void {
  const onNotificationRef = useRef(onNotification)

  useEffect(() => {
    onNotificationRef.current = onNotification
  }, [onNotification])

  useEffect(() => {
    if (!enabled) return

    const controller = new AbortController()

    fetchEventSource(`${API_BASE_URL}/notifications/stream`, {
      signal: controller.signal,
      // `headers` is frozen for every auto-retry, so read the token fresh here instead of going stale.
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          headers: { ...init?.headers, Authorization: `Bearer ${useAuthStore.getState().accessToken ?? ""}` },
        }),
      openWhenHidden: true,
      async onopen(response) {
        if (!response.ok) {
          throw new Error(`Notification stream failed to open: ${response.status}`)
        }
      },
      onmessage(event) {
        if (event.event !== "notification") return
        try {
          onNotificationRef.current(JSON.parse(event.data) as AppNotification)
        } catch {
          // Ignore malformed events.
        }
      },
      onerror() {
        // Returning undefined lets fetchEventSource retry with its default backoff.
      },
    }).catch(() => {
      // AbortError on cleanup, or a terminal failure after retries — nothing to surface here.
    })

    return () => controller.abort()
  }, [enabled])
}
