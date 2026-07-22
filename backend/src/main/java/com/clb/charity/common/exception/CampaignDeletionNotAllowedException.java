package com.clb.charity.common.exception;

import org.springframework.http.HttpStatus;

public class CampaignDeletionNotAllowedException extends ApiException {

    public CampaignDeletionNotAllowedException(String status) {
        super(HttpStatus.BAD_REQUEST,
                "Campaign Deletion Not Allowed",
                ProblemTypes.BASE + "/campaign-deletion-not-allowed",
                "Only DRAFT campaigns can be deleted, but this campaign is '" + status + "'");
    }
}
