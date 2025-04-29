package com.stayswap.domains.user.constant;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public enum UserType {

    KAKAO, NAVER, NORMAL;

    public static UserType from(String type) {
        return UserType.valueOf(type.toUpperCase());
    }

    public static boolean isUserType(String type) {
        List<UserType> userTypes = Arrays.stream(UserType.values())
                .filter(userType -> userType.name().equals(type))
                .collect(Collectors.toList());
        return userTypes.size() != 0;
    }


}
