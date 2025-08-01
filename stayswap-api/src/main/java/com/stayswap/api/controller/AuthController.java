package com.stayswap.api.controller;

import com.stayswap.api.dto.AccessTokenResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Slf4j
@Controller
public class AuthController {


    @GetMapping("/login/oauth2/callback")
    public String oauth2Callback(@RequestParam("accessToken") String accessToken,
                                 HttpServletResponse response) {
        // Access Token을 HttpOnly 쿠키에 저장
        Cookie accessTokenCookie = new Cookie("accessToken", accessToken);
        accessTokenCookie.setHttpOnly(true);
        accessTokenCookie.setSecure(true);
        accessTokenCookie.setPath("/");
        accessTokenCookie.setMaxAge(30 * 60);
        response.addCookie(accessTokenCookie);

        return "redirect:/";
    }

    @PostMapping("/api/auth/refresh")
    @ResponseBody
    public ResponseEntity<?> refreshAuth() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null) {
            if (authentication.isAuthenticated()) {
                return ResponseEntity.ok().build();
            } else {
                log.warn("Authentication 객체는 존재하지만 인증되지 않음.");
                return ResponseEntity.status(401).build();
            }
        } else {
            log.warn("Authentication 객체 없음. 사용자 인증되지 않음.");
            return ResponseEntity.status(401).build();
        }
    }

    @GetMapping("/api/auth/token")
    @ResponseBody
    public ResponseEntity<AccessTokenResponse> getAccessToken(jakarta.servlet.http.HttpServletRequest request) {
        // 쿠키에서 accessToken 추출
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("accessToken".equals(cookie.getName())) {
                    String token = cookie.getValue();
                    return ResponseEntity.ok(new AccessTokenResponse(token));
                }
            }
        }

        log.warn("accessToken 쿠키를 찾을 수 없음");
        return ResponseEntity.status(401).build();
    }
}

