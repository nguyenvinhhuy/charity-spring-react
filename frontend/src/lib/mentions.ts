import { createElement, type ReactNode } from "react"

/** Matches react-mentions' default markup: `@[display name](memberId)`. */
const MENTION_REGEX = /@\[([^\]]+)\]\((\d+)\)/g

/**
 * Parses a comment's stored content and renders `@[Name](id)` mention tokens as highlighted spans,
 * leaving the surrounding plain text untouched. A mention targeting the current viewer is styled
 * differently from mentions of other people, so a viewer immediately notices they were tagged.
 *
 * @param content the raw comment content, as stored (may contain mention markup)
 * @param viewerMemberId the current viewer's member id, or null/undefined when anonymous
 * @returns an array of strings and highlighted mention elements, ready to render
 */
export function renderCommentContent(content: string, viewerMemberId?: number | null): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  MENTION_REGEX.lastIndex = 0
  while ((match = MENTION_REGEX.exec(content)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(content.slice(lastIndex, match.index))
    }
    const isViewer = viewerMemberId != null && Number(match[2]) === viewerMemberId
    nodes.push(
      createElement(
        "span",
        {
          key: `mention-${key++}`,
          className: isViewer ? "text-destructive font-semibold" : "text-primary font-medium",
        },
        `@${match[1]}`
      )
    )
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < content.length) {
    nodes.push(content.slice(lastIndex))
  }
  return nodes
}
