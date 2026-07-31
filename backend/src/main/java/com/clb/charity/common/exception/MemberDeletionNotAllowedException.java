package com.clb.charity.common.exception;

import org.springframework.http.HttpStatus;

public class MemberDeletionNotAllowedException extends ApiException {

    public MemberDeletionNotAllowedException(String detail) {
        super(HttpStatus.BAD_REQUEST,
                "Member Deletion Not Allowed",
                ProblemTypes.BASE + "/member-deletion-not-allowed",
                detail);
    }
}
