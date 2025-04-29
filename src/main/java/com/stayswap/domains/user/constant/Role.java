package com.stayswap.domains.user.constant;

public enum Role {

    ROLE_USER, ROLE_ADMIN;

    public static Role from(String role) {
        return Role.valueOf(role);
    }
}
