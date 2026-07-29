export interface PostSummary {
  id: number
  title: string
  slug: string
  summary: string | null
  titleEn: string | null
  summaryEn: string | null
  thumbnailUrl: string | null
  tags: string[]
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
}

export interface PostDetail extends PostSummary {
  content: string
  contentEn: string | null
  viewCount: number
  createdBy: number | null
  updatedAt: string
}

export interface CreatePostRequest {
  title: string
  summary: string | null
  content: string
  titleEn: string | null
  summaryEn: string | null
  contentEn: string | null
  thumbnailUrl: string | null
  tags: string[]
}

export type UpdatePostRequest = CreatePostRequest
