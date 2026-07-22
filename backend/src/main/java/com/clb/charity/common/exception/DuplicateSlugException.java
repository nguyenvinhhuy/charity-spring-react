package com.clb.charity.common.exception;

import org.springframework.http.HttpStatus;

public class DuplicateSlugException extends ApiException {

    public DuplicateSlugException(String slug) {
        super(HttpStatus.CONFLICT,
                "Duplicate Slug",
                ProblemTypes.BASE + "/duplicate-slug",
                "The slug '" + slug + "' is already in use");
    }
}
