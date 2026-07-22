package com.clb.charity.common.exception;

import org.springframework.http.HttpStatus;

public class MemberNotFoundException extends ApiException {

    public MemberNotFoundException(String identifier) {
        super(HttpStatus.NOT_FOUND,
                "Member Not Found",
                ProblemTypes.BASE + "/member-not-found",
                "Member with identifier '" + identifier + "' does not exist");
    }
}
