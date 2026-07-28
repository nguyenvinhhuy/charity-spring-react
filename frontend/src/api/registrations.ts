import { api } from '@/api/axios';
import type { Page } from "@/types/common"
import type { Registrant, RegistrationSummary } from "@/types/registration"

export interface ListRegistrantsParams {
  page?: number;
  size?: number;
}

/**
 * Fetches a campaign's registration summary as seen by the current viewer.
 *
 * @param campaignId the campaign id
 */
export async function getRegistrationSummary(campaignId: number): Promise<RegistrationSummary> {
  const { data } = await api.get<RegistrationSummary>(`/campaigns/${campaignId}/registrations/summary`);
  return data;
}

/**
 * Registers the current member for a campaign's event.
 *
 * @param campaignId the campaign id
 */
export async function registerForCampaign(campaignId: number): Promise<RegistrationSummary> {
  const { data } = await api.post<RegistrationSummary>(`/campaigns/${campaignId}/registrations/me`);
  return data;
}

/**
 * Cancels the current member's own registration.
 *
 * @param campaignId the campaign id
 */
export async function cancelRegistration(campaignId: number): Promise<void> {
  await api.delete(`/campaigns/${campaignId}/registrations/me`);
}

/**
 * Lists a campaign's registrants, earliest first (admin/contributor roster view).
 *
 * @param campaignId the campaign id
 * @param params pagination options
 */
export async function listRegistrants(
  campaignId: number,
  params: ListRegistrantsParams = {},
): Promise<Page<Registrant>> {
  const { data } = await api.get<Page<Registrant>>(`/campaigns/${campaignId}/registrations`, { params });
  return data;
}

/**
 * Force-removes a member's registration (admin/contributor moderation).
 *
 * @param campaignId the campaign id
 * @param memberId the registrant's member id to remove
 */
export async function removeRegistrant(campaignId: number, memberId: number): Promise<void> {
  await api.delete(`/campaigns/${campaignId}/registrations/${memberId}`);
}
