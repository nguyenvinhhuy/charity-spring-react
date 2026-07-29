import { api } from "@/api/axios"
import type { ReactionTarget } from "@/api/reactions"
import type { Comment, CreateCommentRequest, UpdateCommentRequest } from "@/types/comment"
import type { Page } from "@/types/common"

export interface ListCommentsParams {
  page?: number
  size?: number
}

/**
 * Lists a target's comments, most recent first, with viewer-relative edit/delete permissions.
 *
 * @param target the kind of content being commented on
 * @param id the target's id
 * @param params pagination options
 */
export async function listComments(
  target: ReactionTarget,
  id: number,
  params: ListCommentsParams = {},
): Promise<Page<Comment>> {
  const { data } = await api.get<Page<Comment>>(`/${target}/${id}/comments`, { params })
  return data
}

/**
 * Adds a comment to a target on behalf of the current member.
 *
 * @param target the kind of content being commented on
 * @param id the target's id
 * @param payload the comment content
 */
export async function addComment(target: ReactionTarget, id: number, payload: CreateCommentRequest): Promise<Comment> {
  const { data } = await api.post<Comment>(`/${target}/${id}/comments`, payload)
  return data
}

/**
 * Updates a comment's content (author only, within the edit window).
 *
 * @param target the kind of content being commented on
 * @param id the target's id
 * @param commentId the comment id
 * @param payload the new content
 */
export async function updateComment(
  target: ReactionTarget,
  id: number,
  commentId: number,
  payload: UpdateCommentRequest,
): Promise<Comment> {
  const { data } = await api.put<Comment>(`/${target}/${id}/comments/${commentId}`, payload)
  return data
}

/**
 * Deletes a comment (author, or ADMIN/CONTRIBUTOR moderating it).
 *
 * @param target the kind of content being commented on
 * @param id the target's id
 * @param commentId the comment id
 */
export async function deleteComment(target: ReactionTarget, id: number, commentId: number): Promise<void> {
  await api.delete(`/${target}/${id}/comments/${commentId}`)
}
