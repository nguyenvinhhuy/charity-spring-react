package com.clb.charity.common.exception;

import org.springframework.http.HttpStatus;

public class FaqNotFoundException extends ApiException {

    public FaqNotFoundException(String identifier) {
        super(HttpStatus.NOT_FOUND,
                "FAQ Not Found",
                ProblemTypes.BASE + "/faq-not-found",
                "FAQ with identifier '" + identifier + "' does not exist");
    }
}
