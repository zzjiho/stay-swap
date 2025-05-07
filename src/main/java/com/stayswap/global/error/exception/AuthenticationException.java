package com.stayswap.global.error.exception;


import com.stayswap.global.code.ErrorCode;

public class AuthenticationException extends BusinessException {

    public AuthenticationException(ErrorCode errorCode) {
        super(errorCode);
    }


}
