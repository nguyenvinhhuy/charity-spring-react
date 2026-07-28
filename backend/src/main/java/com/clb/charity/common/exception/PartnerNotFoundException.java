package com.clb.charity.common.exception;

import org.springframework.http.HttpStatus;

public class PartnerNotFoundException extends ApiException {

    public PartnerNotFoundException(String identifier) {
        super(HttpStatus.NOT_FOUND,
                "Partner Not Found",
                ProblemTypes.BASE + "/partner-not-found",
                "Partner with identifier '" + identifier + "' does not exist");
    }
}
