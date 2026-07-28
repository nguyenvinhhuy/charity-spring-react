"use client"

import { useEffect, useRef, useState } from "react"

interface FacebookPageWidgetProps {
  pageUrl: string
}

const RESIZE_THRESHOLD_PX = 12
const WIDGET_HEIGHT = 130

/**
 * Renders the Facebook Page Plugin via its raw iframe embed (not the XFBML/JS-SDK
 * embed), measuring its own container via ResizeObserver to pass an exact pixel width.
 *
 * The raw iframe is used specifically so `colorscheme=light` can be forced: the
 * XFBML embed instead follows the visitor's OS-level dark-mode setting, which
 * renders the header with a black background behind the (transparent-cornered)
 * circular page avatar.
 *
 * @param pageUrl the Facebook page URL to embed
 */
export function FacebookPageWidget({ pageUrl }: FacebookPageWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState<number | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const measured = Math.floor(entries[0].contentRect.width)
      if (measured > 0) {
        setWidth((prev) => (prev === null || Math.abs(prev - measured) > RESIZE_THRESHOLD_PX ? measured : prev))
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const src =
    width === null
      ? null
      : `https://www.facebook.com/plugins/page.php?${new URLSearchParams({
          href: pageUrl,
          tabs: "",
          width: String(width),
          height: String(WIDGET_HEIGHT),
          small_header: "false",
          hide_cover: "false",
          show_facepile: "false",
          colorscheme: "light",
        })}`

  return (
    <div ref={containerRef} className="w-full overflow-hidden rounded-lg border">
      {src && (
        <iframe
          key={width}
          src={src}
          width={width ?? undefined}
          height={WIDGET_HEIGHT}
          style={{ border: "none", overflow: "hidden", display: "block" }}
          title={`Facebook page: ${pageUrl}`}
          allow="encrypted-media"
        />
      )}
    </div>
  )
}
