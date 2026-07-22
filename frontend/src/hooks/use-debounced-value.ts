import { useEffect, useState } from "react"

/**
 * Returns a copy of `value` that only updates after it has been stable for `delayMs`.
 *
 * @param value the fast-changing value to debounce
 * @param delayMs how long the value must be stable before the debounced copy updates
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
