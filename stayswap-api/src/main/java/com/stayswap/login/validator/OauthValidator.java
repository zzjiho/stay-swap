package com.stayswap.login.validator;

import com.stayswap.error.exception.BusinessException;
import com.stayswap.user.constant.UserType;
import org.springframework.stereotype.Service;

import static com.stayswap.code.ErrorCode.*;

@Service
public class OauthValidator {

    // 갖고있는 userType 검증
    public void validateUserType(String userType) {
        if (!UserType.isUserType(userType)) {
            throw new BusinessException(INVALID_USER_TYPE);
        }
    }

}
