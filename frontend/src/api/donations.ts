import { api } from "@/api/axios"
import type { Page } from "@/types/common"
import type { CreateDonationRequest, Donation } from "@/types/donation"

export interface ListDonationsParams {
  page?: number
  size?: number
}

/**
 * List a campaign's donation ledger entries, most recent first.
 *
 * @param campaignId the campaign id
 * @param params pagination options
 */
export async function listDonations(campaignId: number, params: ListDonationsParams = {}): Promise<Page<Donation>> {
  const { data } = await api.get<Page<Donation>>(`/campaigns/${campaignId}/donations`, { params })
  return data
}

/**
 * Records a donation for a campaign and refreshes the campaign's cached totals.
 *
 * @param campaignId the campaign id
 * @param payload the donation fields
 * @returns the created donation
 */
export async function addDonation(campaignId: number, payload: CreateDonationRequest): Promise<Donation> {
  const { data } = await api.post<Donation>(`/campaigns/${campaignId}/donations`, payload)
  return data
}

/**
 * Delete a donation (admin only); reverses its contribution to the campaign's totals.
 *
 * @param campaignId the campaign id
 * @param donationId the donation id
 */
export async function deleteDonation(campaignId: number, donationId: number): Promise<void> {
  await api.delete(`/campaigns/${campaignId}/donations/${donationId}`)
}
