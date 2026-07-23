import { Eye } from "lucide-react"

/** Renders a small eye-icon view count; display-only, the count itself is incremented server-side on fetch. */
export function ViewCountBadge({ count }: { count: number }) {
  return (
    <span className="text-muted-foreground inline-flex items-center gap-1 text-sm">
      <Eye className="size-4" />
      {count}
    </span>
  )
}
