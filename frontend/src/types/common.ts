// Shared primitives used across multiple domains.

export type Role = "ADMIN" | "CONTRIBUTOR" | "MEMBER"

/** Mirrors Spring Data's Page JSON (current page is `number`, 0-based). */
export interface Page<T> {
  content: T[]
  number: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export interface ProblemDetail {
  type: string
  title: string
  status: number
  detail: string
  instance: string
  timestamp: string
  errors?: Record<string, string>
}

export type Granularity = "MONTH" | "QUARTER" | "YEAR"

/** Shared publish/unpublish toggle payload (posts, FAQs). */
export interface PublishRequest {
  published: boolean
}
