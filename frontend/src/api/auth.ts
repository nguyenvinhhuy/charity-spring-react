import { api } from '@/api/axios';
import type {
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  Member,
  RegisterRequest,
  UpdateProfileRequest,
} from '@/types';

/**
 * Register a new MEMBER account and log in, setting the refresh cookie server-side.
 *
 * @param payload the registration fields
 */
export async function register(
  payload: RegisterRequest,
): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/register', payload);
  return data;
}

/**
 * Authenticate with email and password, setting the refresh cookie server-side.
 *
 * @param payload the login credentials
 */
export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', payload);
  return data;
}

/** Exchange the HttpOnly refresh cookie for a fresh access token. */
export async function refresh(): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const { data } = await api.post<{ accessToken: string; expiresIn: number }>(
    '/auth/refresh',
    {},
  );
  return data;
}

/** Invalidate the current session and clear the refresh cookie. */
export async function logout(): Promise<void> {
  await api.post('/auth/logout', {});
}

/** Fetch the currently authenticated member's profile. */
export async function getMe(): Promise<Member> {
  const { data } = await api.get<Member>('/auth/me');
  return data;
}

/**
 * Update the current member's profile (full name, phone, bio, avatar).
 *
 * @param payload the profile fields to update
 */
export async function updateMyProfile(
  payload: UpdateProfileRequest,
): Promise<Member> {
  const { data } = await api.put<Member>('/auth/me', payload);
  return data;
}

/**
 * Change the current member's password.
 *
 * @param payload the current and new password
 */
export async function changeMyPassword(
  payload: ChangePasswordRequest,
): Promise<void> {
  await api.put('/auth/me/password', payload);
}
