import { api, API_BASE_URL } from '@/api/axios';
import type { CampaignCategory, CampaignDetail, CampaignStatus, CampaignSummary, CreateCampaignRequest, PublicCampaignStats, UpdateCampaignRequest } from "@/types/campaign"
import type { Page } from "@/types/common"

export interface ListCampaignsParams {
  status?: CampaignStatus;
  category?: CampaignCategory;
  search?: string;
  page?: number;
  size?: number;
}

/**
 * List campaigns with optional status/category/search filters and pagination.
 *
 * @param params filter and pagination options
 */
export async function listCampaigns(
  params: ListCampaignsParams = {},
): Promise<Page<CampaignSummary>> {
  const { data } = await api.get<Page<CampaignSummary>>('/campaigns', {
    params,
  });
  return data;
}

/**
 * Fetch a single campaign's full detail by its slug.
 *
 * @param slug the campaign slug
 */
export async function getCampaign(slug: string): Promise<CampaignDetail> {
  const { data } = await api.get<CampaignDetail>(`/campaigns/${slug}`);
  return data;
}

/**
 * Create a new campaign (admin/contributor).
 *
 * @param payload the campaign fields
 */
export async function createCampaign(
  payload: CreateCampaignRequest,
): Promise<CampaignDetail> {
  const { data } = await api.post<CampaignDetail>('/campaigns', payload);
  return data;
}

/**
 * Update an existing campaign by id.
 *
 * @param id campaign id
 * @param payload the updated campaign fields
 */
export async function updateCampaign(
  id: number,
  payload: UpdateCampaignRequest,
): Promise<CampaignDetail> {
  const { data } = await api.put<CampaignDetail>(`/campaigns/${id}`, payload);
  return data;
}

/**
 * Change a campaign's lifecycle status.
 *
 * @param id campaign id
 * @param status the target status
 */
export async function updateCampaignStatus(
  id: number,
  status: CampaignStatus,
): Promise<CampaignDetail> {
  const { data } = await api.patch<CampaignDetail>(`/campaigns/${id}/status`, {
    status,
  });
  return data;
}

/**
 * Update a campaign's fundraising progress (amount raised + donor count).
 *
 * @param id campaign id
 * @param progress the updated amount raised and donor count
 */
export async function updateCampaignProgress(
  id: number,
  progress: { currentAmount: number; donorCount: number },
): Promise<CampaignDetail> {
  const { data } = await api.patch<CampaignDetail>(
    `/campaigns/${id}/progress`,
    progress,
  );
  return data;
}

/**
 * Delete a campaign by id (only permitted for DRAFT campaigns).
 *
 * @param id campaign id
 */
export async function deleteCampaign(id: number): Promise<void> {
  await api.delete(`/campaigns/${id}`);
}

/**
 * Fetch the public-safe campaign and donation totals (no per-donor or per-actor detail).
 */
export async function getPublicCampaignStats(): Promise<PublicCampaignStats> {
  const { data } = await api.get<PublicCampaignStats>('/campaigns/stats');
  return data;
}

/**
 * Records one view of a campaign's detail page (fire-and-forget, call once per page load).
 *
 * @param id campaign id
 */
export async function recordCampaignView(id: number): Promise<void> {
  await api.post(`/campaigns/${id}/views`);
}

/**
 * Build the VietQR image URL for a campaign, optionally pinned to an amount.
 *
 * @param slug the campaign slug
 * @param amount optional amount to pin the QR code to
 * @returns a plain URL suitable for an <img src>
 */
export function campaignQrUrl(slug: string, amount?: number): string {
  const base = `${API_BASE_URL}/campaigns/${slug}/qr`;
  return amount && amount > 0 ? `${base}?amount=${amount}` : base;
}
