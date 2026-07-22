// Domain types mirroring the backend JSON (camelCase).

export type Role = 'ADMIN' | 'CONTRIBUTOR' | 'MEMBER';

export type CampaignStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CLOSED'
  | 'ARCHIVED';

export type CampaignCategory =
  | 'CHILDREN'
  | 'EDUCATION'
  | 'HEALTHCARE'
  | 'DISASTER_RELIEF'
  | 'ELDERLY'
  | 'ENVIRONMENT'
  | 'OTHER';

export interface Member {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  phone: string | null;
  bio: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CampaignSummary {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  titleEn: string | null;
  summaryEn: string | null;
  thumbnailUrl: string | null;
  targetAmount: number;
  currentAmount: number;
  donorCount: number;
  status: CampaignStatus;
  category: CampaignCategory;
  startDate: string;
  endDate: string | null;
  eventStartDate: string | null;
  eventEndDate: string | null;
}

export interface CampaignDetail extends CampaignSummary {
  description: string;
  descriptionEn: string | null;
  images: string[];
  bankAccountNo: string;
  bankAccountName: string;
  qrDescription: string | null;
  thienNguyenUrl: string | null;
  statementUrl: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PostSummary {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  titleEn: string | null;
  summaryEn: string | null;
  thumbnailUrl: string | null;
  tags: string[];
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export interface PostDetail extends PostSummary {
  content: string;
  contentEn: string | null;
  createdBy: number | null;
  updatedAt: string;
}

/** Mirrors Spring Data's Page JSON (current page is `number`, 0-based). */
export interface Page<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// ---- Donation ledger ----

export interface Donation {
  id: number;
  campaignId: number;
  amount: number;
  donorName: string | null;
  donatedAt: string;
  note: string | null;
  createdAt: string;
}

export interface CreateDonationRequest {
  amount: number;
  donorName: string | null;
  donatedAt: string;
  note: string | null;
}

// ---- Dashboard ----

export type Granularity = 'MONTH' | 'QUARTER' | 'YEAR';

export interface RoleCount {
  role: Role;
  count: number;
}

export interface CategoryAmount {
  category: CampaignCategory;
  amount: number;
}

export interface CampaignProgressItem {
  id: number;
  title: string;
  titleEn: string | null;
  currentAmount: number;
  targetAmount: number;
  percent: number;
  status: CampaignStatus;
}

export interface DonationPoint {
  period: string;
  amount: number;
  count: number;
}

export type ActivityType = 'CAMPAIGN_CREATED' | 'DONATION_ADDED' | 'POST_CREATED';

export interface ActivityItem {
  type: ActivityType;
  title: string;
  amount: number;
  actorName: string | null;
  at: string | null;
}

export interface DashboardSummary {
  totalRaised: number;
  totalDonors: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalCampaigns: number;
  totalMembers: number;
  membersByRole: RoleCount[];
  amountByCategory: CategoryAmount[];
  campaignProgress: CampaignProgressItem[];
  donationSeries: DonationPoint[];
  recentActivity: ActivityItem[];
}

export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  timestamp: string;
  errors?: Record<string, string>;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  member: Member;
}

// ---- Request payload types ----

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  phone: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface CreateCampaignRequest {
  title: string;
  summary: string | null;
  description: string;
  titleEn: string | null;
  summaryEn: string | null;
  descriptionEn: string | null;
  category: CampaignCategory;
  targetAmount: number;
  thumbnailUrl: string | null;
  images: string[];
  bankAccountNo: string;
  bankAccountName: string;
  qrDescription: string | null;
  thienNguyenUrl: string | null;
  statementUrl: string | null;
  startDate: string;
  endDate: string | null;
  eventStartDate: string | null;
  eventEndDate: string | null;
}

export type UpdateCampaignRequest = CreateCampaignRequest;

export interface UpdateStatusRequest {
  status: CampaignStatus;
}

export interface UpdateProgressRequest {
  currentAmount: number;
  donorCount: number;
}

export interface CreatePostRequest {
  title: string;
  summary: string | null;
  content: string;
  titleEn: string | null;
  summaryEn: string | null;
  contentEn: string | null;
  thumbnailUrl: string | null;
  tags: string[];
}

export type UpdatePostRequest = CreatePostRequest;

export interface PublishRequest {
  published: boolean;
}

export interface CreateMemberRequest {
  fullName: string;
  email: string;
  password: string;
  role: Role;
}

export interface UpdateRoleRequest {
  role: Role;
}

// ---- Internal activities (non-fundraising events) ----

export interface Event {
  id: number;
  title: string;
  titleEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  eventStartDate: string;
  eventEndDate: string | null;
  location: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventRequest {
  title: string;
  titleEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  eventStartDate: string;
  eventEndDate: string | null;
  location: string | null;
}

export type UpdateEventRequest = CreateEventRequest;

// ---- FAQs ----

export interface Faq {
  id: number;
  question: string;
  answer: string;
  questionEn: string | null;
  answerEn: string | null;
  category: string | null;
  sortOrder: number;
  isPublished: boolean;
  publishedAt: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFaqRequest {
  question: string;
  answer: string;
  questionEn: string | null;
  answerEn: string | null;
  category: string | null;
  sortOrder: number;
}

export type UpdateFaqRequest = CreateFaqRequest;
