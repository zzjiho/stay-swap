package com.stayswap.global.error.exception;

import com.stayswap.global.code.ErrorCode;
import lombok.Getter;

@Getter
public abstract class CustomRunTimeException extends RuntimeException {
    private final ErrorCode errorCode;

    public CustomRunTimeException(String message, ErrorCode errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public CustomRunTimeException(String message, Throwable cause, ErrorCode errorCode) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public CustomRunTimeException(Throwable cause, ErrorCode errorCode) {
        super(cause);
        this.errorCode = errorCode;
    }

    public CustomRunTimeException(String message, Throwable cause, boolean enableSuppression,
                                  boolean writableStackTrace, ErrorCode errorCode) {
        super(message, cause, enableSuppression, writableStackTrace);
        this.errorCode = errorCode;
    }

}
