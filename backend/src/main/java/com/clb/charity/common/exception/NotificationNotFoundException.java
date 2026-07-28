package com.clb.charity.common.exception;

import org.springframework.http.HttpStatus;

public class NotificationNotFoundException extends ApiException {

    public NotificationNotFoundException(String identifier) {
        super(HttpStatus.NOT_FOUND,
                "Notification Not Found",
                ProblemTypes.BASE + "/notification-not-found",
                "Notification with identifier '" + identifier + "' does not exist");
    }
}
