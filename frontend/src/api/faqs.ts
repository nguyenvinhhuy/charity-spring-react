import { api } from '@/api/axios';
import type { CreateFaqRequest, Faq, Page, UpdateFaqRequest } from '@/types';

export interface ListFaqsParams {
  published?: boolean;
  search?: string;
  page?: number;
  size?: number;
}

/**
 * List FAQs, optionally filtered by published state and a question text search, ordered by sort order.
 *
 * @param params filter and pagination options
 */
export async function listFaqs(
  params: ListFaqsParams = {},
): Promise<Page<Faq>> {
  const { data } = await api.get<Page<Faq>>('/faqs', { params });
  return data;
}

/**
 * Create a new FAQ (admin/contributor).
 *
 * @param payload the FAQ fields
 */
export async function createFaq(payload: CreateFaqRequest): Promise<Faq> {
  const { data } = await api.post<Faq>('/faqs', payload);
  return data;
}

/**
 * Update an existing FAQ by id.
 *
 * @param id FAQ id
 * @param payload the updated FAQ fields
 */
export async function updateFaq(
  id: number,
  payload: UpdateFaqRequest,
): Promise<Faq> {
  const { data } = await api.put<Faq>(`/faqs/${id}`, payload);
  return data;
}

/**
 * Publish or unpublish a FAQ (admin only).
 *
 * @param id FAQ id
 * @param published whether the FAQ should be published
 */
export async function publishFaq(id: number, published: boolean): Promise<Faq> {
  const { data } = await api.patch<Faq>(`/faqs/${id}/publish`, { published });
  return data;
}

/**
 * Delete a FAQ by id (admin only).
 *
 * @param id FAQ id
 */
export async function deleteFaq(id: number): Promise<void> {
  await api.delete(`/faqs/${id}`);
}
