package com.stayswap.stayswap.global.error.exception;

import com.stayswap.stayswap.global.code.ErrorCode;
import lombok.Getter;

/**
 * 비즈니스 로직 수행 중 예외를 발생시켜야 하는 경우 사용할 CustomException
 */
@Getter
public class BusinessException extends RuntimeException {

    private ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }


}
