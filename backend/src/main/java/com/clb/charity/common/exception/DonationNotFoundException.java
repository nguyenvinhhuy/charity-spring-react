package com.clb.charity.common.exception;

import org.springframework.http.HttpStatus;

public class DonationNotFoundException extends ApiException {

    public DonationNotFoundException(String identifier) {
        super(HttpStatus.NOT_FOUND,
                "Donation Not Found",
                ProblemTypes.BASE + "/donation-not-found",
                "Donation with identifier '" + identifier + "' does not exist");
    }
}
