export interface Partner {
  id: number
  name: string
  logoUrl: string
  websiteUrl: string | null
  displayOrder: number | null
  createdAt: string
  updatedAt: string
}

export interface CreatePartnerRequest {
  name: string
  logoUrl: string
  websiteUrl: string | null
  displayOrder: number | null
}

export type UpdatePartnerRequest = CreatePartnerRequest
