"use client"

import { useState } from "react"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Mention, MentionsInput, type SuggestionDataItem } from "react-mentions"
import { Pencil, Trash2 } from "lucide-react"
import { addComment, deleteComment, listComments, updateComment } from "@/api/comments"
import { searchMentions } from "@/api/members"
import { getErrorMessage } from "@/api/axios"
import type { ReactionTarget } from "@/api/reactions"
import { useAuthStore } from "@/store/authStore"
import type { Comment } from "@/types/comment"
import type { Page } from "@/types/common"
import { renderCommentContent } from "@/lib/mentions"
import { initialsOf, colorOf } from "@/lib/avatar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const PAGE_SIZE = 5

// No WebSocket/SSE infrastructure exists yet, so other viewers' comments only surface via this
// periodic poll rather than instantly.
const POLL_INTERVAL_MS = 10_000

/** Inline style object for `react-mentions`, mapped onto this project's shadcn CSS variables (see index.css). */
const mentionsInputStyle = {
  control: {
    fontSize: 14,
    fontFamily: "inherit",
    // Must reserve the same height as `input.minHeight` below: the highlighter (whose flow
    // height this wrapper otherwise takes) can be shorter than the absolutely-positioned
    // textarea, which would then visually overflow past this wrapper onto whatever follows.
    minHeight: 40,
  },
  input: {
    margin: 0,
    padding: "0.5rem 0.75rem",
    border: "1px solid var(--border)",
    borderRadius: "0.375rem",
    outline: "none",
    color: "var(--foreground)",
    minHeight: 40,
  },
  highlighter: {
    padding: "0.5rem 0.75rem",
    border: "1px solid transparent",
  },
  suggestions: {
    list: {
      backgroundColor: "var(--popover)",
      color: "var(--popover-foreground)",
      border: "1px solid var(--border)",
      borderRadius: "0.375rem",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    },
    item: {
      padding: "0.5rem 0.75rem",
      "&focused": {
        backgroundColor: "var(--muted)",
      },
    },
  },
}

const mentionStyle = {
  backgroundColor: "var(--primary)",
  opacity: 0.15,
  borderRadius: "0.25rem",
}

// react-mentions relies on `Mention.defaultProps` for this, which React 19 no longer applies to
// function components — passing it explicitly avoids a crash inside the library's selection
// handler (`displayTransform is not a function`) every time a suggestion is picked.
function mentionDisplayTransform(id: string | number, display: string): string {
  return display || String(id)
}

/** Formats an ISO date string as a Vietnamese short date+time. */
function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })
}

interface CommentSectionProps {
  target: ReactionTarget
  targetId: number
}

/**
 * Renders a comment section shared by campaign and post detail pages: post/edit/delete with
 * @mention autocomplete, an initial 5-comment page, and a "view all" expansion.
 *
 * @param target the kind of content being commented on
 * @param targetId the target's id
 */
export function CommentSection({ target, targetId }: CommentSectionProps) {
  const { t } = useTranslation()
  const member = useAuthStore((s) => s.member)
  const queryClient = useQueryClient()

  const [showingAll, setShowingAll] = useState(false)
  const [draft, setDraft] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Comment | null>(null)

  const commentsQueryKey = ["comments", target, targetId, showingAll]

  /** Fetches @mention suggestions for the comment input, reporting results via react-mentions' callback. */
  function fetchMentions(query: string, callback: (data: SuggestionDataItem[]) => void) {
    if (!query) {
      callback([])
      return
    }
    searchMentions(query)
      .then((results) => callback(results.map((m) => ({ id: m.id, display: m.fullName }))))
      .catch(() => callback([]))
  }

  const postMutation = useMutation({
    mutationFn: (content: string) => addComment(target, targetId, { content }),
    onSuccess: (created) => {
      queryClient.setQueryData<Page<Comment>>(commentsQueryKey, (prev) =>
        prev ? { ...prev, content: [created, ...prev.content], totalElements: prev.totalElements + 1 } : prev,
      )
      setDraft("")
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  /** Posts a new comment, prepending it to the list optimistically. */
  function handlePost() {
    if (!draft.trim() || postMutation.isPending) return
    postMutation.mutate(draft.trim())
  }

  function startEdit(comment: Comment) {
    setEditingId(comment.id)
    setEditDraft(comment.content)
  }

  const editMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) =>
      updateComment(target, targetId, commentId, { content }),
    onSuccess: (updated) => {
      queryClient.setQueryData<Page<Comment>>(commentsQueryKey, (prev) =>
        prev ? { ...prev, content: prev.content.map((c) => (c.id === updated.id ? updated : c)) } : prev,
      )
      setEditingId(null)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  /** Saves an in-place edit, replacing the comment in the list on success. */
  function handleSaveEdit(commentId: number) {
    if (!editDraft.trim() || editMutation.isPending) return
    editMutation.mutate({ commentId, content: editDraft.trim() })
  }

  const deleteMutation = useMutation({
    mutationFn: (comment: Comment) => deleteComment(target, targetId, comment.id),
    onSuccess: (_result, comment) => {
      queryClient.setQueryData<Page<Comment>>(commentsQueryKey, (prev) =>
        prev
          ? {
              ...prev,
              content: prev.content.filter((c) => c.id !== comment.id),
              totalElements: prev.totalElements - 1,
            }
          : prev,
      )
      setDeleteTarget(null)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const { data, isLoading: loading } = useQuery({
    queryKey: commentsQueryKey,
    queryFn: () => {
      const prevTotal = queryClient.getQueryData<Page<Comment>>(commentsQueryKey)?.totalElements
      const size = showingAll ? Math.max(PAGE_SIZE, prevTotal ?? PAGE_SIZE) : PAGE_SIZE
      return listComments(target, targetId, { page: 0, size })
    },
    // Paused while a post/edit/delete is in flight so the poll can't clobber its own optimistic update.
    refetchInterval: () =>
      postMutation.isPending || editMutation.isPending || deleteMutation.isPending ? false : POLL_INTERVAL_MS,
    // Keeps the current thread on screen while "view all" expands to the larger page size.
    placeholderData: keepPreviousData,
  })

  const comments = data?.content ?? []
  const total = data?.totalElements ?? 0
  const hasMore = !showingAll && total > comments.length
  // The API returns newest-first; a comment thread reads top-to-bottom oldest-to-newest, like a
  // chat, with the composer anchored at the bottom right after the latest comment.
  const displayComments = [...comments].reverse()

  return (
    <section className="flex flex-col gap-4 border-t pt-8">
      <h2 className="font-semibold">{t("comments.title", { count: total })}</h2>

      {hasMore && (
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => setShowingAll(true)}>
          {t("comments.viewAll", { count: total })}
        </Button>
      )}

      {loading ? (
        <p className="text-muted-foreground py-6 text-center text-sm">{t("comments.loading")}</p>
      ) : displayComments.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">{t("comments.empty")}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {displayComments.map((comment, index) => {
            // Consecutive comments from the same author collapse into one avatar/name block,
            // Slack-style, instead of repeating the author's identity on every single comment.
            const sameAuthorAsPrevious = index > 0 && displayComments[index - 1].authorName === comment.authorName
            return (
              <div key={comment.id} className="flex gap-3">
                {sameAuthorAsPrevious ? (
                  <div className="size-8 shrink-0" />
                ) : (
                  <Avatar className="size-8 shrink-0">
                    <AvatarFallback className={colorOf(comment.authorName)}>
                      {initialsOf(comment.authorName)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    {!sameAuthorAsPrevious && <span className="text-sm font-medium">{comment.authorName}</span>}
                    <span className="text-muted-foreground text-xs">{formatDateTime(comment.createdAt)}</span>
                    {comment.edited && <span className="text-muted-foreground text-xs">{t("comments.edited")}</span>}
                    {editingId !== comment.id && (comment.canEdit || comment.canDelete) && (
                      <div className="ml-auto flex gap-3">
                        {comment.canEdit && (
                          <button
                            type="button"
                            onClick={() => startEdit(comment)}
                            className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1 text-xs"
                          >
                            <Pencil className="size-3" />
                            {t("comments.edit")}
                          </button>
                        )}
                        {comment.canDelete && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(comment)}
                            className="text-muted-foreground hover:text-destructive inline-flex cursor-pointer items-center gap-1 text-xs"
                          >
                            <Trash2 className="size-3" />
                            {t("comments.delete")}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {editingId === comment.id ? (
                    <div className="mt-1 flex flex-col gap-2">
                      <MentionsInput
                        value={editDraft}
                        onChange={(_e, newValue) => setEditDraft(newValue)}
                        style={mentionsInputStyle}
                      >
                        <Mention
                          trigger="@"
                          data={fetchMentions}
                          markup="@[__display__](__id__)"
                          displayTransform={mentionDisplayTransform}
                          style={mentionStyle}
                          appendSpaceOnAdd
                        />
                      </MentionsInput>
                      <div className="flex gap-2">
                        <Button size="sm" disabled={editMutation.isPending} onClick={() => handleSaveEdit(comment.id)}>
                          {editMutation.isPending ? t("comments.saving") : t("comments.save")}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          {t("comments.cancel")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm whitespace-pre-wrap">
                      {renderCommentContent(comment.content, member?.id)}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {member ? (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <MentionsInput
              value={draft}
              onChange={(_e, newValue) => setDraft(newValue)}
              placeholder={t("comments.placeholder")}
              style={mentionsInputStyle}
              a11ySuggestionsListLabel={t("comments.mentionNoResults")}
            >
              <Mention
                trigger="@"
                data={fetchMentions}
                markup="@[__display__](__id__)"
                displayTransform={mentionDisplayTransform}
                style={mentionStyle}
                appendSpaceOnAdd
              />
            </MentionsInput>
          </div>
          <Button className="h-10" disabled={!draft.trim() || postMutation.isPending} onClick={handlePost}>
            {postMutation.isPending ? t("comments.posting") : t("comments.submit")}
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">{t("comments.loginPrompt")}</p>
      )}

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("comments.deleteDialog.title")}</DialogTitle>
            <DialogDescription>{t("comments.deleteDialog.description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t("comments.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t("comments.deleteDialog.deleting") : t("comments.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
