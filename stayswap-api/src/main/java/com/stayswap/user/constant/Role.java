package com.stayswap.user.constant;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

public enum Role {

    ROLE_USER, ROLE_ADMIN;

    public static GrantedAuthority from(String role) {
        return new SimpleGrantedAuthority(role);
    }
}
