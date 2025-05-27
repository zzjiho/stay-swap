package com.stayswap.util;

import com.stayswap.code.ErrorCode;
import com.stayswap.error.exception.BusinessException;
import org.springframework.util.StringUtils;

public class AuthorizationHeaderUtils {

    public static void validateAuthorization(String authorizationHeader) {
        if (!StringUtils.hasText(authorizationHeader)) {
            throw new BusinessException(ErrorCode.NOT_AUTHORIZED);
        }
    }
} 