import { api } from '@/api/axios';
import type { CreateInquiryRequest, Inquiry, InquiryStatus, Page } from '@/types';

export interface ListInquiriesParams {
  page?: number;
  size?: number;
  status?: InquiryStatus;
}

/**
 * Submits a public contact-form inquiry.
 *
 * @param payload the submitted fields
 */
export async function submitInquiry(payload: CreateInquiryRequest): Promise<Inquiry> {
  const { data } = await api.post<Inquiry>('/inquiries', payload);
  return data;
}

/**
 * Lists contact-form inquiries, newest first (admin/contributor only).
 *
 * @param params pagination and optional status filter
 */
export async function listInquiries(params: ListInquiriesParams = {}): Promise<Page<Inquiry>> {
  const { data } = await api.get<Page<Inquiry>>('/inquiries', { params });
  return data;
}

/**
 * Marks an inquiry as handled (admin/contributor only).
 *
 * @param id inquiry id
 */
export async function markInquiryHandled(id: number): Promise<Inquiry> {
  const { data } = await api.patch<Inquiry>(`/inquiries/${id}/handled`);
  return data;
}

/**
 * Deletes an inquiry (admin/contributor only).
 *
 * @param id inquiry id
 */
export async function deleteInquiry(id: number): Promise<void> {
  await api.delete(`/inquiries/${id}`);
}
