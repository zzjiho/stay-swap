package com.stayswap.global.util;

import com.stayswap.global.code.ErrorCode;
import com.stayswap.global.error.exception.BusinessException;
import org.springframework.util.StringUtils;

public class AuthorizationHeaderUtils {

    public static void validateAuthorization(String authorizationHeader) {
        if (!StringUtils.hasText(authorizationHeader)) {
            throw new BusinessException(ErrorCode.NOT_AUTHORIZED);
        }
    }
} 