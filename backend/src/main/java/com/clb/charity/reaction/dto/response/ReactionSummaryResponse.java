package com.clb.charity.reaction.dto.response;

import com.clb.charity.reaction.domain.ReactionType;
import org.jspecify.annotations.Nullable;

import java.util.List;
import java.util.Map;

public record ReactionSummaryResponse(
        long total,
        Map<ReactionType, Long> counts,
        Map<ReactionType, List<String>> reactorNames,
        @Nullable ReactionType myReaction
) {
}
