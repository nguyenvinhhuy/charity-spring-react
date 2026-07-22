package com.clb.charity.common.exception;

import org.springframework.http.HttpStatus;

public class PostNotFoundException extends ApiException {

    public PostNotFoundException(String identifier) {
        super(HttpStatus.NOT_FOUND,
                "Post Not Found",
                ProblemTypes.BASE + "/post-not-found",
                "Post with identifier '" + identifier + "' does not exist");
    }
}
