import type { Role } from './common';

export interface Member {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  phone: string | null;
  bio: string | null;
  dateOfBirth: string | null;
  address: string | null;
  nationalId: string | null;
  leadershipTitle: string | null;
  teamDisplayOrder: number | null;
  isActive: boolean;
  createdAt: string;
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

// ---- Team (About page) ----

export interface TeamMember {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  leadershipTitle: string;
}

export interface UpdateTeamProfileRequest {
  leadershipTitle: string | null;
  teamDisplayOrder: number | null;
}

export interface MemberMention {
  id: number;
  fullName: string;
  avatarUrl: string | null;
}
