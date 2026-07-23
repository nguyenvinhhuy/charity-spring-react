package com.clb.charity.comment.dto.response;

import java.time.Instant;

public record CommentResponse(
        Long id,
        Long targetId,
        String authorName,
        String content,
        Instant createdAt,
        Instant updatedAt,
        boolean edited,
        boolean canEdit,
        boolean canDelete
) {
}
