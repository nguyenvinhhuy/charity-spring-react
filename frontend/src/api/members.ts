import { api } from '@/api/axios';
import type {
  CreateMemberRequest,
  Member,
  MemberMention,
  Page,
  Role,
} from '@/types';

export interface ListMembersParams {
  page?: number;
  size?: number;
  search?: string;
  role?: Role;
  active?: boolean;
}

/**
 * List members with pagination (admin only).
 *
 * @param params pagination options
 */
export async function listMembers(
  params: ListMembersParams = {},
): Promise<Page<Member>> {
  const { data } = await api.get<Page<Member>>('/members', { params });
  return data;
}

/**
 * Fetch a single member by id.
 *
 * @param id member id
 */
export async function getMember(id: number): Promise<Member> {
  const { data } = await api.get<Member>(`/members/${id}`);
  return data;
}

/**
 * Search active members by name for @mention autocomplete (any authenticated member may call this).
 *
 * @param query the partial name to search for
 */
export async function searchMentions(query: string): Promise<MemberMention[]> {
  const { data } = await api.get<MemberMention[]>('/members/mentions', {
    params: { query },
  });
  return data;
}

/**
 * Create a new member account (admin only).
 *
 * @param payload the member fields
 */
export async function createMember(
  payload: CreateMemberRequest,
): Promise<Member> {
  const { data } = await api.post<Member>('/members', payload);
  return data;
}

/**
 * Change a member's role (admin only).
 *
 * @param id member id
 * @param role the new role
 */
export async function updateMemberRole(
  id: number,
  role: Role,
): Promise<Member> {
  const { data } = await api.patch<Member>(`/members/${id}/role`, { role });
  return data;
}

/**
 * Activate or deactivate a member account (admin only).
 *
 * @param id member id
 * @param active whether the account should be active
 */
export async function setMemberActive(
  id: number,
  active: boolean,
): Promise<Member> {
  const { data } = await api.patch<Member>(`/members/${id}/status`, { active });
  return data;
}
