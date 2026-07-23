package com.clb.charity.reaction.dto.request;

import com.clb.charity.reaction.domain.ReactionType;
import jakarta.validation.constraints.NotNull;

public record SetReactionRequest(
        @NotNull ReactionType type
) {
}
