package com.stayswap.auth.handler;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class CustomLogoutSuccessHandler implements LogoutSuccessHandler {

    private final RedisTemplate<String, String> redisTemplate;

    @Override
    public void onLogoutSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException, ServletException {

        log.info("로그아웃 성공 핸들러 실행");

        // 1. Redis에서 Refresh Token 삭제
        if (authentication != null && authentication.getPrincipal() instanceof org.springframework.security.oauth2.jwt.Jwt) {
            org.springframework.security.oauth2.jwt.Jwt jwt = (org.springframework.security.oauth2.jwt.Jwt) authentication.getPrincipal();
            String userId = jwt.getSubject();
            String refreshTokenKey = "refreshToken:" + userId;
            Boolean deleted = redisTemplate.delete(refreshTokenKey);
            if (deleted != null && deleted) {
                log.info("Redis에서 Refresh Token 삭제 성공: {}", refreshTokenKey);
            } else {
                log.warn("Redis에서 Refresh Token 삭제 실패 또는 존재하지 않음: {}", refreshTokenKey);
            }
        } else {
            log.warn("인증 객체에서 사용자 ID를 추출할 수 없거나 JWT Principal이 아님. Redis에서 Refresh Token 삭제 건너뜀.");
        }

        // 2. Access Token 및 Refresh Token 쿠키 만료
        Cookie accessTokenCookie = new Cookie("accessToken", "");
        accessTokenCookie.setHttpOnly(true);
        accessTokenCookie.setSecure(true);
        accessTokenCookie.setPath("/");
        accessTokenCookie.setMaxAge(0);
        response.addCookie(accessTokenCookie);

        Cookie refreshTokenCookie = new Cookie("refreshToken", "");
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(true);
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setMaxAge(0);
        response.addCookie(refreshTokenCookie);

        log.info("Access Token 및 Refresh Token 쿠키 만료 처리 완료");

        // 3. 클라이언트를 로그인 페이지 또는 메인 페이지로 리다이렉트
        response.sendRedirect("/page/auth");
    }
}
