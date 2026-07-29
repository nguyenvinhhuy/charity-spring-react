export interface Comment {
  id: number
  targetId: number
  authorName: string
  content: string
  createdAt: string
  updatedAt: string
  edited: boolean
  canEdit: boolean
  canDelete: boolean
}

export interface CreateCommentRequest {
  content: string
}

export type UpdateCommentRequest = CreateCommentRequest
