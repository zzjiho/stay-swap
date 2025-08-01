package com.stayswap.common.util;

import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class JwtWebSocketUtils {

    private final JwtDecoder jwtDecoder;

    /**
     * WebSocket Authorization 헤더에서 JWT 토큰을 추출하고 사용자 ID를 반환
     */
    public Long extractUserIdFromToken(String authorization) {
        if (authorization == null) {
            throw new RuntimeException("Authorization 헤더가 없습니다.");
        }

        String token = authorization.replace("Bearer ", "");
        if (token == null || token.equals("null") || token.trim().isEmpty()) {
            throw new RuntimeException("유효하지 않은 토큰입니다.");
        }

        try {
            Jwt jwt = jwtDecoder.decode(token);
            return extractUserIdFromJwt(jwt);
        } catch (Exception e) {
            throw new RuntimeException("JWT 토큰 디코딩 실패: " + e.getMessage());
        }
    }

    /**
     * JWT에서 사용자 ID를 추출
     */
    private Long extractUserIdFromJwt(Jwt jwt) {
        String subject = jwt.getSubject();
        if (subject != null && !subject.trim().isEmpty()) {
            return Long.parseLong(subject);
        }

        Object userIdClaim = jwt.getClaim("userId");
        if (userIdClaim != null) {
            if (userIdClaim instanceof Integer) {
                return Long.valueOf((Integer) userIdClaim);
            } else if (userIdClaim instanceof Long) {
                return (Long) userIdClaim;
            } else if (userIdClaim instanceof String) {
                return Long.parseLong((String) userIdClaim);
            }
        }

        throw new RuntimeException("JWT에서 사용자 ID를 추출할 수 없습니다.");
    }
}