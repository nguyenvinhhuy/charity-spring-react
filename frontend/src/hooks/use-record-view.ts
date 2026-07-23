import { useEffect, useRef } from "react"

/**
 * Calls `record(id)` exactly once per real page view, guarded against React StrictMode's
 * dev-only double-invoke of effects (which would otherwise double-count the view).
 *
 * @param id the target's id, or null while it hasn't loaded yet
 * @param record the fire-and-forget call that records the view
 */
export function useRecordView(id: number | null, record: (id: number) => Promise<void>): void {
  const recordedId = useRef<number | null>(null)

  useEffect(() => {
    if (id === null || recordedId.current === id) return
    recordedId.current = id
    record(id).catch(() => {
      // Non-critical: view counts are best-effort, never surface an error for this.
    })
  }, [id, record])
}
