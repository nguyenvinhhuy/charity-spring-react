package com.clb.charity.common.exception;

import org.springframework.http.HttpStatus;

public class EventNotFoundException extends ApiException {

    public EventNotFoundException(String identifier) {
        super(HttpStatus.NOT_FOUND,
                "Event Not Found",
                ProblemTypes.BASE + "/event-not-found",
                "Event with identifier '" + identifier + "' does not exist");
    }
}
