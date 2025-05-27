package com.stayswap.login.validator;

import com.stayswap.user.constant.UserType;
import com.stayswap.global.code.ErrorCode;
import com.stayswap.global.error.exception.BusinessException;
import org.springframework.stereotype.Service;

@Service
public class OauthValidator {

    // 갖고있는 userType 검증
    public void validateUserType(String userType) {
        if (!UserType.isUserType(userType)) {
            throw new BusinessException(ErrorCode.INVALID_USER_TYPE);
        }
    }

}
