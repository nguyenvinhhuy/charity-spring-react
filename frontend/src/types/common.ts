// Shared primitives used across multiple domains.

export type Role = "ADMIN" | "CONTRIBUTOR" | "MEMBER"

/** Mirrors Spring Data's PagedModel JSON (current page is `page.number`, 0-based). */
export interface PageMeta {
  size: number
  number: number
  totalElements: number
  totalPages: number
}

export interface Page<T> {
  content: T[]
  page: PageMeta
}

/** True when `page` is the first page (0-based). */
export function isFirstPage(page: PageMeta): boolean {
  return page.number === 0
}

/** True when `page` is the last page, including the empty-result case. */
export function isLastPage(page: PageMeta): boolean {
  return page.number >= page.totalPages - 1
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
