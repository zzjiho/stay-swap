package com.stayswap.common.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

import java.util.Collections;
import java.util.List;

@Slf4j
@RequiredArgsConstructor
public class JwtWebSocketInterceptor implements ChannelInterceptor {

    private final JwtDecoder jwtDecoder;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            // WebSocket 연결 시 인증 처리
            authenticateUser(accessor);
        } else if (accessor != null && StompCommand.SEND.equals(accessor.getCommand())) {
            // 메시지 전송 시에도 인증 정보가 필요한 경우
            if (accessor.getUser() == null) {
                authenticateUser(accessor);
            }
        }
        
        return message;
    }

    private void authenticateUser(StompHeaderAccessor accessor) {
        try {
            // WebSocket 세션에서 쿠키 헤더 확인
            List<String> cookieHeaders = accessor.getNativeHeader("Cookie");
            if (cookieHeaders != null && !cookieHeaders.isEmpty()) {
                String cookieHeader = cookieHeaders.get(0);
                String accessToken = getTokenFromCookieHeader(cookieHeader);
                
                if (accessToken != null) {
                    Jwt jwt = jwtDecoder.decode(accessToken);
                    
                    // JWT에서 userId 추출
                    Long userId = extractUserId(jwt);
                    
                    // Spring Security Authentication 생성
                    List<SimpleGrantedAuthority> authorities = Collections.singletonList(
                        new SimpleGrantedAuthority("ROLE_USER")
                    );
                    
                    UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(userId.toString(), null, authorities);
                    
                    accessor.setUser(authentication);
                    log.info("WebSocket 인증 성공: userId={}", userId);
                }
            }
        } catch (Exception e) {
            log.error("WebSocket 인증 실패: {}", e.getMessage());
        }
    }

    private String getTokenFromCookieHeader(String cookieHeader) {
        if (cookieHeader == null) return null;
        
        String[] cookies = cookieHeader.split("; ");
        for (String cookie : cookies) {
            String[] parts = cookie.split("=", 2);
            if (parts.length == 2 && "accessToken".equals(parts[0])) {
                return parts[1];
            }
        }
        return null;
    }

    private Long extractUserId(Jwt jwt) {
        Object userIdClaim = jwt.getClaim("userId");
        if (userIdClaim instanceof Integer) {
            return Long.valueOf((Integer) userIdClaim);
        } else if (userIdClaim instanceof Long) {
            return (Long) userIdClaim;
        } else if (userIdClaim instanceof String) {
            return Long.parseLong((String) userIdClaim);
        }
        throw new RuntimeException("JWT에서 userId를 추출할 수 없습니다.");
    }
}