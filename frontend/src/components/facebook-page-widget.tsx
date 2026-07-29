"use client"

import { useEffect, useRef, useState } from "react"

interface FacebookSdkWindow extends Window {
  FB?: { XFBML: { parse: (element?: HTMLElement) => void } }
}

interface FacebookPageWidgetProps {
  pageUrl: string
}

const RESIZE_THRESHOLD_PX = 12

/**
 * Renders the real Facebook Page Plugin (XFBML), measuring its own container via ResizeObserver
 * and passing that exact pixel width to Facebook — its own `adapt_container_width` option does
 * not reliably match the actual container size, so we compute and pass the width ourselves.
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

  useEffect(() => {
    if (width === null) return
    ;(window as unknown as FacebookSdkWindow).FB?.XFBML.parse(containerRef.current ?? undefined)
  }, [width])

  return (
    <div ref={containerRef} className="w-full overflow-hidden rounded-lg border" style={{ colorScheme: "light" }}>
      {width !== null && (
        <div
          key={width}
          className="fb-page"
          data-href={pageUrl}
          data-tabs=""
          data-width={width}
          data-height="130"
          data-small-header="false"
          data-hide-cover="false"
          data-show-facepile="false"
        >
          <blockquote cite={pageUrl} className="fb-xfbml-parse-ignore">
            <a href={pageUrl} target="_blank" rel="noreferrer">
              {pageUrl}
            </a>
          </blockquote>
        </div>
      )}
    </div>
  )
}
