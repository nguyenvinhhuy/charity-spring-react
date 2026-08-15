import { QueryCache, QueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getErrorMessage } from "@/api/axios"

// No other client writes these rows, so a short staleTime just avoids refetching on remount.
const DEFAULT_STALE_TIME_MS = 30_000

export const queryClient = new QueryClient({
  // Centralizes read-error toasts here instead of a `useEffect` per query.
  queryCache: new QueryCache({
    // Keyed by message so sonner collapses duplicate-error toasts instead of stacking them.
    // A query can opt out via `meta: { silent: true }` (e.g. an auth bootstrap check where
    // "not logged in" is an expected, not exceptional, outcome).
    onError: (error, query) => {
      if (query.meta?.silent) return
      const message = getErrorMessage(error)
      toast.error(message, { id: message })
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_STALE_TIME_MS,
      refetchOnWindowFocus: false,
    },
  },
})
