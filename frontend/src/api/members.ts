import { api } from "@/api/axios"
import type { Page, Role } from "@/types/common"
import type { CreateMemberRequest, Member, MemberMention, TeamMember, UpdateTeamProfileRequest } from "@/types/member"

export interface ListMembersParams {
  page?: number
  size?: number
  search?: string
  role?: Role
  active?: boolean
}

/**
 * List members with pagination (admin only).
 *
 * @param params pagination options
 */
export async function listMembers(params: ListMembersParams = {}): Promise<Page<Member>> {
  const { data } = await api.get<Page<Member>>("/members", { params })
  return data
}

/**
 * Fetch a single member by id.
 *
 * @param id member id
 */
export async function getMember(id: number): Promise<Member> {
  const { data } = await api.get<Member>(`/members/${id}`)
  return data
}

/**
 * Search active members by name for @mention autocomplete (any authenticated member may call this).
 *
 * @param query the partial name to search for
 */
export async function searchMentions(query: string): Promise<MemberMention[]> {
  const { data } = await api.get<MemberMention[]>("/members/mentions", {
    params: { query },
  })
  return data
}

/**
 * Create a new member account (admin only).
 *
 * @param payload the member fields
 */
export async function createMember(payload: CreateMemberRequest): Promise<Member> {
  const { data } = await api.post<Member>("/members", payload)
  return data
}

/**
 * Change a member's role (admin only).
 *
 * @param id member id
 * @param role the new role
 */
export async function updateMemberRole(id: number, role: Role): Promise<Member> {
  const { data } = await api.patch<Member>(`/members/${id}/role`, { role })
  return data
}

/**
 * Activate or deactivate a member account (admin only).
 *
 * @param id member id
 * @param active whether the account should be active
 */
export async function setMemberActive(id: number, active: boolean): Promise<Member> {
  const { data } = await api.patch<Member>(`/members/${id}/status`, { active })
  return data
}

/**
 * List active members featured on the public About page's team section.
 */
export async function listTeam(): Promise<TeamMember[]> {
  const { data } = await api.get<TeamMember[]>("/members/team")
  return data
}

/**
 * Set or clear a member's public team display fields (admin only).
 *
 * @param id member id
 * @param payload the new team display values
 */
export async function updateTeamProfile(id: number, payload: UpdateTeamProfileRequest): Promise<Member> {
  const { data } = await api.patch<Member>(`/members/${id}/team-profile`, payload)
  return data
}

/**
 * Revoke every refresh token issued to a member, ending their session on any device (admin only).
 *
 * @param id member id
 */
export async function forceLogoutMember(id: number): Promise<void> {
  await api.post(`/members/${id}/force-logout`)
}

/**
 * Permanently delete a deactivated member, reattributing any content they created to the caller (admin only).
 *
 * @param id member id
 */
export async function deleteMember(id: number): Promise<void> {
  await api.delete(`/members/${id}`)
}
