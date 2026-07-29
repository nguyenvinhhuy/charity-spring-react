export interface Donation {
  id: number
  campaignId: number
  amount: number
  donorName: string | null
  donatedAt: string
  note: string | null
  createdAt: string
}

export interface CreateDonationRequest {
  amount: number
  donorName: string | null
  donatedAt: string
  note: string | null
}
