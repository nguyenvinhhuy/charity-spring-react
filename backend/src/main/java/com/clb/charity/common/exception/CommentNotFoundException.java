package com.clb.charity.common.exception;

import org.springframework.http.HttpStatus;

public class CommentNotFoundException extends ApiException {

    public CommentNotFoundException(String identifier) {
        super(HttpStatus.NOT_FOUND,
                "Comment Not Found",
                ProblemTypes.BASE + "/comment-not-found",
                "Comment with identifier '" + identifier + "' does not exist");
    }
}
