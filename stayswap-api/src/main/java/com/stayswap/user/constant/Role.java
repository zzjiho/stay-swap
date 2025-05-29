package com.stayswap.user.constant;

public enum Role {

    ROLE_USER, ROLE_ADMIN;

    public static com.stayswap.jwt.constant.Role from(String role) {
        return com.stayswap.jwt.constant.Role.valueOf(role);
    }
}
