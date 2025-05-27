package com.stayswap.error.exception;


import com.stayswap.code.ErrorCode;

public class AuthenticationException extends BusinessException {

    public AuthenticationException(ErrorCode errorCode) {
        super(errorCode);
    }


}
