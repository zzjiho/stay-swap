package com.stayswap.api.login.controller;

import com.stayswap.api.login.dto.RefreshTokenRequest;
import com.stayswap.api.login.dto.TokenResponse;
import com.stayswap.api.login.service.TokenService;
import com.stayswap.domains.user.repository.UserRepository;
import com.stayswap.global.model.RestApiResponse;
import com.stayswap.global.util.AuthorizationHeaderUtils;
import com.stayswap.jwt.service.TokenManager;
import io.jsonwebtoken.Claims;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

@Tag(name = "authentication", description = "로그인/로그아웃/토큰재발급 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class TokenController {

    private final TokenService tokenService;
    private final TokenManager tokenManager;
    private final UserRepository userRepository;
    private final Environment environment;


    @Tag(name = "authentication")
    @Operation(summary = "Access Token 재발급 API", description = "Header를 이용한 Access Token 재발급 API")
    @PostMapping("/access-token/issue")
    public RestApiResponse<TokenResponse> createAccessToken(HttpServletRequest httpServletRequest) {
        String authorizationHeader = httpServletRequest.getHeader("Authorization");

        AuthorizationHeaderUtils.validateAuthorization(authorizationHeader);

        String accessToken = authorizationHeader.split(" ")[1];

        Claims tokenClaims = tokenManager.getTokenClaims(accessToken);
        Long userId = Long.valueOf((Integer) tokenClaims.get("userId"));

        String refreshToken = userRepository.findRefreshTokenById(userId);

        TokenResponse tokenResponseDto
                = tokenService.createAccessTokenByRefreshToken(refreshToken);

        return RestApiResponse.success(tokenResponseDto);
    }

    @Tag(name = "authentication")
    @Operation(summary = "Access Token 재발급 API 2", description = "ReqeustBody를 이용한 Access Token 재발급 API")
    @PostMapping("/access-token/issue2")
    public RestApiResponse<TokenResponse> createAccessToken(
            @RequestBody RefreshTokenRequest request) {

        String refreshToken = request.getRefreshToken();
        TokenResponse tokenResponseDto = tokenService.createAccessTokenByRefreshToken(refreshToken);

        return RestApiResponse.success(tokenResponseDto);
    }
    
    @Tag(name = "authentication")
    @Operation(summary = "쿠키 기반 토큰 갱신 API", description = "HttpOnly 쿠키의 refreshToken을 사용하여 accessToken을 갱신하는 API")
    @GetMapping("/token/refresh")
    public ResponseEntity<TokenResponse> refreshTokenFromCookie(HttpServletRequest request, HttpServletResponse response) {
        // 쿠키에서 refreshToken 추출
        Cookie[] cookies = request.getCookies();
        String refreshToken = null;
        
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("refreshToken".equals(cookie.getName())) {
                    refreshToken = cookie.getValue();
                    break;
                }
            }
        }
        
        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        // 토큰 갱신 로직
        TokenResponse tokenResponse = tokenService.createAccessTokenByRefreshToken(refreshToken);
        
        // 새로운 refreshToken이 있다면 쿠키 갱신
        if (tokenResponse.getRefreshToken() != null) {
            Cookie refreshTokenCookie = new Cookie("refreshToken", tokenResponse.getRefreshToken());
            refreshTokenCookie.setHttpOnly(true);
            refreshTokenCookie.setPath("/");
            // 쿠키 만료 시간 설정
            long maxAge = (tokenResponse.getRefreshTokenExpireTime().getTime() - System.currentTimeMillis()) / 1000;
            refreshTokenCookie.setMaxAge((int) maxAge);
            
            // HTTPS 환경에서는 Secure 플래그 활성화 (프로덕션 환경에서 사용)
            String[] activeProfiles = environment.getActiveProfiles();
            boolean isProduction = Arrays.stream(activeProfiles)
                    .anyMatch(profile -> profile.equals("prod") || profile.equals("production"));
            
            if (isProduction) {
                refreshTokenCookie.setSecure(true);
                // XSS 공격 방지를 위한 추가 설정
                refreshTokenCookie.setAttribute("SameSite", "Lax");
            }
            
            response.addCookie(refreshTokenCookie);
            
            // 응답에서는 refreshToken 제외
            tokenResponse = TokenResponse.builder()
                    .grantType(tokenResponse.getGrantType())
                    .accessToken(tokenResponse.getAccessToken())
                    .accessTokenExpireTime(tokenResponse.getAccessTokenExpireTime())
                    .build();
        }
        
        return ResponseEntity.ok(tokenResponse);
    }
    
    @Tag(name = "authentication")
    @Operation(summary = "로그아웃 API", description = "사용자 로그아웃 처리 및 쿠키 삭제")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        // refreshToken 쿠키 삭제
        Cookie cookie = new Cookie("refreshToken", null);
        cookie.setMaxAge(0); // 즉시 만료
        cookie.setPath("/");
        
        // HTTPS 환경에서는 Secure 플래그 활성화 (프로덕션 환경에서 사용)
        String[] activeProfiles = environment.getActiveProfiles();
        boolean isProduction = Arrays.stream(activeProfiles)
                .anyMatch(profile -> profile.equals("prod") || profile.equals("production"));
        
        if (isProduction) {
            cookie.setSecure(true);
            // XSS 공격 방지를 위한 추가 설정
            cookie.setAttribute("SameSite", "Lax");
        }
        
        response.addCookie(cookie);
        
        return ResponseEntity.ok().build();
    }
}
