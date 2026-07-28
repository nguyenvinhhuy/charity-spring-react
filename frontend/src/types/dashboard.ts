import type { CampaignCategory, CampaignStatus } from './campaign';
import type { Role } from './common';

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
