package com.stayswap.error.exception;


import com.stayswap.code.ErrorCode;

public class InvalidException extends CustomRunTimeException {

    public InvalidException(ErrorCode errorCode) {
        super(errorCode.getMessage(), errorCode);
    }

}
