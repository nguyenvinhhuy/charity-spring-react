package com.clb.charity.common.exception;

import org.springframework.http.HttpStatus;

public class InquiryNotFoundException extends ApiException {

    public InquiryNotFoundException(String identifier) {
        super(HttpStatus.NOT_FOUND,
                "Inquiry Not Found",
                ProblemTypes.BASE + "/inquiry-not-found",
                "Inquiry with identifier '" + identifier + "' does not exist");
    }
}
