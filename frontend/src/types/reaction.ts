export type ReactionType = 'LIKE' | 'LOVE' | 'CELEBRATE' | 'LAUGH' | 'SURPRISED' | 'SAD';

export interface ReactionSummary {
  total: number;
  counts: Record<ReactionType, number>;
  reactorNames: Partial<Record<ReactionType, string[]>>;
  myReaction: ReactionType | null;
}
