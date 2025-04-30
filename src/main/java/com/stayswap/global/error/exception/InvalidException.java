package com.stayswap.global.error.exception;


import com.stayswap.global.code.ErrorCode;

public class InvalidException extends CustomRunTimeException {

    public InvalidException(ErrorCode errorCode) {
        super(errorCode.getMessage(), errorCode);
    }

}
