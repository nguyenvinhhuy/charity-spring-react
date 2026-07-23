package com.clb.charity.common.exception;

import org.springframework.http.HttpStatus;

public class CampaignCapacityRequiredException extends ApiException {

    public CampaignCapacityRequiredException() {
        super(HttpStatus.BAD_REQUEST,
                "Campaign Capacity Required",
                ProblemTypes.BASE + "/campaign-capacity-required",
                "A capacity can only be set together with an event start date, and vice versa");
    }
}
