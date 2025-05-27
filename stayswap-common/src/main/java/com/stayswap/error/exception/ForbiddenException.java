package com.stayswap.error.exception;


import com.stayswap.code.ErrorCode;

public class ForbiddenException extends CustomRunTimeException {

    public ForbiddenException(String message, ErrorCode errorCode) {
        super(message, errorCode);
    }

    public ForbiddenException(ErrorCode errorCode) {
        super(errorCode.getMessage(), errorCode);
    }

    public ForbiddenException(String message) {
        super(message, ErrorCode.NOT_AUTHORIZED);
    }
}
