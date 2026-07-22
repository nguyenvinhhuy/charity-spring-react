package com.clb.charity.common.exception;

import org.springframework.http.HttpStatus;

public class InvalidStatusTransitionException extends ApiException {

    public InvalidStatusTransitionException(String from, String to) {
        super(HttpStatus.BAD_REQUEST,
                "Invalid Status Transition",
                ProblemTypes.BASE + "/invalid-status-transition",
                "Cannot transition campaign from '" + from + "' to '" + to + "'");
    }
}
