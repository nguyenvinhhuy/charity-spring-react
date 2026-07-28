import { api } from '@/api/axios';
import type { ReactionSummary, ReactionType } from "@/types/reaction"

export type ReactionTarget = 'campaigns' | 'posts';

/**
 * Fetches a target's reaction summary (per-type counts, reactor names, and the caller's own pick).
 *
 * @param target the kind of content being reacted to
 * @param id the target's id
 */
export async function getReactionSummary(
  target: ReactionTarget,
  id: number,
): Promise<ReactionSummary> {
  const { data } = await api.get<ReactionSummary>(`/${target}/${id}/reactions`);
  return data;
}

/**
 * Sets (creating or changing) the current member's reaction on a target.
 *
 * @param target the kind of content being reacted to
 * @param id the target's id
 * @param type the chosen reaction
 */
export async function setReaction(
  target: ReactionTarget,
  id: number,
  type: ReactionType,
): Promise<void> {
  await api.put(`/${target}/${id}/reactions/me`, { type });
}

/**
 * Removes the current member's reaction on a target, if any.
 *
 * @param target the kind of content being reacted to
 * @param id the target's id
 */
export async function removeReaction(target: ReactionTarget, id: number): Promise<void> {
  await api.delete(`/${target}/${id}/reactions/me`);
}
