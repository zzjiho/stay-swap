package com.stayswap.auth.controller;

import com.stayswap.auth.service.AuthUserService;
import com.stayswap.user.model.entity.User;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;

@RestController("authServerController")
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final JwtDecoder jwtDecoder;
    private final JwtEncoder jwtEncoder;
    private final RedisTemplate<String, String> redisTemplate;
    private final AuthUserService authUserService;

    // at 만료시 rt로 요청
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshAccessToken(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = null;
        if (request.getCookies() != null) {
            refreshToken = Arrays.stream(request.getCookies())
                    .filter(c -> c.getName().equals("refreshToken"))
                    .findFirst()
                    .map(Cookie::getValue)
                    .orElse(null);
        }

        if (refreshToken == null) {
            log.warn("리프레시 토큰이 쿠키에서 발견되지 않음.");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token not found.");
        }

        try {
            // Refresh Token 유효성 검증
            org.springframework.security.oauth2.jwt.Jwt decodedRefreshToken = jwtDecoder.decode(refreshToken);
            String userId = decodedRefreshToken.getSubject();
            String tokenType = decodedRefreshToken.getClaim("tokenType");

            if (!"REFRESH".equals(tokenType)) {
                log.warn("제공된 토큰이 리프레시 토큰이 아님. 토큰 타입: {}", tokenType);
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token type.");
            }

            // Redis에 저장된 Refresh Token과 일치하는지 확인
            String storedRefreshToken = redisTemplate.opsForValue().get("refreshToken:" + userId);
            if (storedRefreshToken == null || !storedRefreshToken.equals(refreshToken)) {
                log.warn("리프레시 토큰 불일치 또는 Redis에서 찾을 수 없음. 사용자: {}", userId);
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token.");
            }

            User user = authUserService.findById(Long.parseLong(userId))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found."));

            // 새로운 Access Token 생성
            String newAccessToken = generateAccessToken(user.getId());

            // Refresh Token Rotation: 새로운 Refresh Token 생성 및 Redis 업데이트
            String newRefreshToken = generateRefreshToken(user.getId());
            redisTemplate.opsForValue().set("refreshToken:" + user.getId(), newRefreshToken, Duration.ofDays(14));

            // 새로운 Access Token을 쿠키에 저장
            Cookie accessTokenCookie = new Cookie("accessToken", newAccessToken);
            accessTokenCookie.setHttpOnly(true);
            accessTokenCookie.setSecure(true);
            accessTokenCookie.setPath("/");
            accessTokenCookie.setDomain("www.stayzzle.com");
            accessTokenCookie.setMaxAge((int) Duration.ofMinutes(30).toSeconds());
            response.addCookie(accessTokenCookie);

            // 새로운 Refresh Token을 쿠키에 저장
            Cookie refreshTokenCookie = new Cookie("refreshToken", newRefreshToken);
            refreshTokenCookie.setHttpOnly(true);
            refreshTokenCookie.setSecure(true);
            refreshTokenCookie.setPath("/");
            refreshTokenCookie.setDomain("www.stayzzle.com");
            refreshTokenCookie.setMaxAge((int) Duration.ofDays(14).toSeconds());
            response.addCookie(refreshTokenCookie);

            log.info("액세스 토큰이 성공적으로 갱신됨. 사용자: {}", userId);
            return ResponseEntity.ok().build();

        } catch (JwtException e) {
            log.error("JWT 유효성 검증 실패: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token.", e);
        } catch (Exception e) {
            log.error("토큰 갱신 중 오류 발생: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Token refresh failed.", e);
        }
    }

    private String generateAccessToken(Long userId) {
        Instant now = Instant.now();
        long expiry = Duration.ofMinutes(30).toSeconds();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("stayswap")
                .issuedAt(now)
                .expiresAt(now.plusSeconds(expiry))
                .subject(userId.toString())
                .claim("role", "USER")
                .claim("tokenType", "ACCESS")
                .build();

        return this.jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
    }

    private String generateRefreshToken(Long userId) {
        Instant now = Instant.now();
        long expiry = Duration.ofDays(14).toSeconds();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("stayswap")
                .issuedAt(now)
                .expiresAt(now.plusSeconds(expiry))
                .subject(userId.toString())
                .claim("tokenType", "REFRESH")
                .build();

        return this.jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = null;
        if (request.getCookies() != null) {
            refreshToken = Arrays.stream(request.getCookies())
                    .filter(c -> c.getName().equals("refreshToken"))
                    .findFirst()
                    .map(Cookie::getValue)
                    .orElse(null);
        }

        if (refreshToken != null) {
            try {
                org.springframework.security.oauth2.jwt.Jwt decodedRefreshToken = jwtDecoder.decode(refreshToken);
                String userId = decodedRefreshToken.getSubject();
                redisTemplate.delete("refreshToken:" + userId);
                log.info("Redis에서 리프레시 토큰 삭제됨. 사용자: {}", userId);
            } catch (JwtException e) {
                log.warn("로그아웃 중 유효하지 않은 리프레시 토큰: {}", e.getMessage());
            }
        }

        // 쿠키 삭제
        Cookie accessTokenCookie = new Cookie("accessToken", null);
        accessTokenCookie.setHttpOnly(true);
        accessTokenCookie.setSecure(true);
        accessTokenCookie.setPath("/");
        accessTokenCookie.setDomain("www.stayzzle.com");
        accessTokenCookie.setMaxAge(0);
        response.addCookie(accessTokenCookie);

        Cookie refreshTokenCookie = new Cookie("refreshToken", null);
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(true);
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setDomain("www.stayzzle.com");
        refreshTokenCookie.setMaxAge(0);
        response.addCookie(refreshTokenCookie);

        return ResponseEntity.ok().build();
    }
}