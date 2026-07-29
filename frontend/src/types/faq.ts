export interface Faq {
  id: number
  question: string
  answer: string
  questionEn: string | null
  answerEn: string | null
  category: string | null
  sortOrder: number
  isPublished: boolean
  publishedAt: string | null
  createdBy: number | null
  createdAt: string
  updatedAt: string
}

export interface CreateFaqRequest {
  question: string
  answer: string
  questionEn: string | null
  answerEn: string | null
  category: string | null
  sortOrder: number
}

export type UpdateFaqRequest = CreateFaqRequest
