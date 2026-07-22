package com.clb.charity.common.exception;

import org.springframework.http.HttpStatus;

public class CampaignNotFoundException extends ApiException {

    public CampaignNotFoundException(String identifier) {
        super(HttpStatus.NOT_FOUND,
                "Campaign Not Found",
                ProblemTypes.BASE + "/campaign-not-found",
                "Campaign with identifier '" + identifier + "' does not exist");
    }
}
