package com.clb.charity.common.exception;

import org.springframework.http.HttpStatus;

public class CommentAccessDeniedException extends ApiException {

    public CommentAccessDeniedException(String reason) {
        super(HttpStatus.FORBIDDEN,
                "Comment Access Denied",
                ProblemTypes.BASE + "/comment-access-denied",
                reason);
    }
}
