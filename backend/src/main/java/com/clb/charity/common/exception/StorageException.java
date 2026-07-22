package com.clb.charity.common.exception;

import org.springframework.http.HttpStatus;

public class StorageException extends ApiException {

    public StorageException(String detail) {
        super(HttpStatus.INTERNAL_SERVER_ERROR,
                "Storage Error",
                ProblemTypes.BASE + "/storage-error",
                detail);
    }
}
