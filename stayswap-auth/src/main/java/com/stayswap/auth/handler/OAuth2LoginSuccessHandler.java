package com.stayswap.auth.handler;

import com.stayswap.auth.service.AuthUserService;
import com.stayswap.user.model.entity.User;
import com.stayswap.user.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * 로그인 성공시 사용자 정보 엔티티에 매핑 및 로그인/회원가입 처리
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final AuthUserService authUserService;
    private final JwtEncoder jwtEncoder;
    private final RedisTemplate<String, String> redisTemplate;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        log.debug("OAuth2User attributes: {}", oauth2User.getAttributes());

        // 카카오 사용자 정보 추출
        String kakaoId = oauth2User.getAttribute("id").toString();
        String email = null;
        String userName = null;
        String profileImage = null;

        if (oauth2User.getAttributes().containsKey("kakao_account")) {
            @SuppressWarnings("unchecked")
            Map<String, Object> kakaoAccount = (Map<String, Object>) oauth2User.getAttribute("kakao_account");
            email = (String) kakaoAccount.get("email");

            if (kakaoAccount.containsKey("profile")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
                userName = (String) profile.get("nickname");
                profileImage = (String) profile.get("thumbnail_image_url");
            }
        }

        if (email == null || email.trim().isEmpty()) {
            email = kakaoId + "@kakao.com";
        }

        final String finalEmail = email;
        final String finalUserName = userName;
        final String finalProfileImage = profileImage;
        User user = userRepository.findByEmail(finalEmail)
                .orElseGet(() -> authUserService.createSocialUser(finalEmail, finalUserName, finalProfileImage));

        log.info("Social login success for user: {} (email: {})", user.getId(), email);

        // JWT Access Token 및 Refresh Token 생성
        String accessToken = generateAccessToken(user.getId());
        String refreshToken = generateRefreshToken(user.getId());

        // Redis에 Refresh Token 저장
        redisTemplate.opsForValue().set("refreshToken:" + user.getId(), refreshToken, Duration.ofDays(14));

        // Access Token을 쿠키에 저장
        Cookie accessTokenCookie = new Cookie("accessToken", accessToken);
        accessTokenCookie.setHttpOnly(true);
        accessTokenCookie.setSecure(true);
        accessTokenCookie.setPath("/");
        accessTokenCookie.setMaxAge((int) Duration.ofMinutes(30).toSeconds());
        response.addCookie(accessTokenCookie);

        // Refresh Token을 쿠키에 저장
        Cookie refreshTokenCookie = new Cookie("refreshToken", refreshToken);
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(true);
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setMaxAge((int) Duration.ofDays(14).toSeconds());
        response.addCookie(refreshTokenCookie);

        String targetUrl = UriComponentsBuilder.fromUriString("http://localhost:8080/auth")
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
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
}