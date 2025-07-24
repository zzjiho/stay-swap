package com.stayswap.common.config.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Collection;
import java.util.Collections;

/**
 * JWT에서 권한 정보를 추출하는 커스텀 컨버터
 */
public class StaySwapJwtGrantedAuthoritiesConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        // 기존 JWT에서 role 클레임 추출
        String role = jwt.getClaimAsString("role");
        
        if (role != null) {
            // role이 이미 ROLE_ 접두사를 포함하고 있다면 그대로 사용, 없다면 추가
            String authority = role.startsWith("ROLE_") ? role : "ROLE_" + role;
            return Collections.singletonList(new SimpleGrantedAuthority(authority));
        }
        
        return Collections.emptyList();
    }
}