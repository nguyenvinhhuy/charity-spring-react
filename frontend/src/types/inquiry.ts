export type InquiryStatus = 'NEW' | 'HANDLED';

export interface Inquiry {
  id: number;
  fullName: string;
  email: string;
  subject: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
  handledAt: string | null;
}

export interface CreateInquiryRequest {
  fullName: string;
  email: string;
  subject: string;
  message: string;
  website?: string;
  formRenderedAtMs?: number;
}
