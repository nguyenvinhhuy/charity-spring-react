import { api } from '@/api/axios';
import type { CreatePartnerRequest, Partner, UpdatePartnerRequest } from "@/types/partner"

/**
 * List all partners (co-organizing units), ordered for public display.
 */
export async function listPartners(): Promise<Partner[]> {
  const { data } = await api.get<Partner[]>('/partners');
  return data;
}

/**
 * Create a new partner (admin/contributor).
 *
 * @param payload the partner fields
 */
export async function createPartner(payload: CreatePartnerRequest): Promise<Partner> {
  const { data } = await api.post<Partner>('/partners', payload);
  return data;
}

/**
 * Update an existing partner by id.
 *
 * @param id partner id
 * @param payload the updated partner fields
 */
export async function updatePartner(
  id: number,
  payload: UpdatePartnerRequest,
): Promise<Partner> {
  const { data } = await api.put<Partner>(`/partners/${id}`, payload);
  return data;
}

/**
 * Delete a partner by id (admin only).
 *
 * @param id partner id
 */
export async function deletePartner(id: number): Promise<void> {
  await api.delete(`/partners/${id}`);
}
