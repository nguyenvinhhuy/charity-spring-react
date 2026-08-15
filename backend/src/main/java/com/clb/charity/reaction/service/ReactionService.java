package com.clb.charity.reaction.service;

import com.clb.charity.common.model.ReactionTargetType;
import com.clb.charity.reaction.domain.ReactionType;
import com.clb.charity.reaction.dto.response.ReactionSummaryResponse;
import org.jspecify.annotations.Nullable;

/**
 * Reaction operations shared by any content type (campaigns, posts) that supports reactions.
 */
public interface ReactionService {

    /**
     * Builds the reaction summary for a target: per-type counts, reactor names, and the viewer's own pick.
     *
     * @param targetType the kind of content being reacted to
     * @param targetId the target's id
     * @param viewerMemberId the viewing member's id, or null when anonymous
     * @return the reaction summary
     */
    ReactionSummaryResponse getSummary(ReactionTargetType targetType, Long targetId, @Nullable Long viewerMemberId);

    /**
     * Sets (creating or changing) the calling member's reaction on a target.
     *
     * @param targetType the kind of content being reacted to
     * @param targetId the target's id
     * @param memberId the reacting member's id
     * @param type the chosen reaction
     */
    void setReaction(ReactionTargetType targetType, Long targetId, Long memberId, ReactionType type);

    /**
     * Removes the calling member's reaction on a target, if any (idempotent).
     *
     * @param targetType the kind of content being reacted to
     * @param targetId the target's id
     * @param memberId the reacting member's id
     */
    void removeReaction(ReactionTargetType targetType, Long targetId, Long memberId);

    /**
     * Deletes every reaction recorded against a target, used when the target itself is deleted.
     *
     * @param targetType the kind of content being reacted to
     * @param targetId the target's id
     */
    void deleteAllForTarget(ReactionTargetType targetType, Long targetId);
}
