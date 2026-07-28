import type { Member } from './member';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  member: Member;
}

export interface UpdateProfileRequest {
  fullName: string;
  phone: string | null;
  bio: string | null;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  address: string | null;
  nationalId: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
