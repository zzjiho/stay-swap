package com.stayswap.kakaotoken.controller;

import com.stayswap.error.exception.Custom404Exception;
import com.stayswap.kakaotoken.client.KakaoTokenClient;
import com.stayswap.kakaotoken.dto.KakaoTokenDto;
import com.stayswap.kakaotoken.util.KakaoApiUtil;
import com.stayswap.kakaotoken.util.RequestUrlUtil;
import com.stayswap.login.dto.OauthLoginDto;
import com.stayswap.login.service.OauthLoginService;
import com.stayswap.user.constant.UserType;
import com.stayswap.util.EnvironmentUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

@Slf4j
@Controller
@RequiredArgsConstructor
public class KakaoTokenController {

    private final EnvironmentUtil env;
    private final KakaoTokenClient kakaoTokenClient;
    private final OauthLoginService oauthLoginService;
    private final Environment environment;

    @Value("${kakao.client.id}")
    private String clientId;

    @Value("${kakao.client.secret}")
    private String clientSecret;

    @GetMapping("/kakao/login")
    public String kakaoLogin2() {
        return "kakaoLoginForm";
    }

    // step1 : 인가코드 받기
    @GetMapping("/kakao")
    public void kakaoLogin(
            HttpServletRequest request,
            HttpServletResponse response) {

        String clientId = env.getKakaoClientId();

        String serviceUri = RequestUrlUtil.getServiceURL(request);
        String redirectUri = "/oauth/kakao/callback";
        String resultUri = serviceUri + redirectUri;
        log.info("[-] kakaoLogin resultUri : {}", resultUri);

        // 카카오 accessToken 발급 요청
        String kakaoCallURL = KakaoApiUtil.getKakaoAuthorizeURL(clientId, resultUri);
        log.info("[-] kakaoLogin Kakao First CallURL : {}", kakaoCallURL);

        try {
            response.sendRedirect(kakaoCallURL);
        } catch (IOException e) {
            log.error("[-] kakaoLogin redirect error ", e);
            throw new Custom404Exception("카카오 서비스가 준비 중입니다. 잠시 후 다시 시도해 주세요. [KCR01]");
        }
    }

    //Step 2 : 토큰받기
    @GetMapping("/oauth/kakao/callback")
    public void loginCallback(
            HttpServletRequest request,
            HttpServletResponse response,
            @RequestParam("code") String code) throws IOException {

        String contentType = "application/x-www-form-urlencoded;charset=utf-8";

        String serviceUri = RequestUrlUtil.getServiceURL(request);
        String redirectUri = "/oauth/kakao/callback";
        String resultUri = serviceUri + redirectUri;

        KakaoTokenDto.Request kakaoTokenRequestDto = KakaoTokenDto.Request.builder()
                .client_id(clientId)
                .client_secret(clientSecret)
                .grant_type("authorization_code")
                .code(code)
                .redirect_uri(resultUri)
                .build();

        log.info("code : {}", code);
        log.info("step2: redirectUri : {}", resultUri);

        KakaoTokenDto.Response kakaoToken = kakaoTokenClient.requestKakaoToken(contentType, kakaoTokenRequestDto);
        log.info("[-] kakaoToken : {}", kakaoToken);

        // OauthLoginService를 직접 호출하여 로그인 처리
        try {
            OauthLoginDto.Response jwtToken = oauthLoginService.oauthLogin(
                    kakaoToken.getAccess_token(), 
                    UserType.KAKAO
            );
            
            // JWT refreshToken을 쿠키에 저장
            Cookie refreshTokenCookie = new Cookie("refreshToken", jwtToken.getRefreshToken());
            refreshTokenCookie.setHttpOnly(true);
            refreshTokenCookie.setPath("/");
            // 쿠키 만료 시간 설정
            long maxAge = (jwtToken.getRefreshTokenExpireTime().getTime() - System.currentTimeMillis()) / 1000;
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
            
            // 액세스 토큰 일회성으로 사용 후 메모리에 저장
            String redirectUrl = "/?auth_success=true&token=" +
                URLEncoder.encode(jwtToken.getAccessToken(), StandardCharsets.UTF_8) + 
                "&expire=" + jwtToken.getAccessTokenExpireTime().getTime();
            
            // 홈페이지로 리다이렉트 (토큰은 URL 파라미터로 전달)
            response.sendRedirect(redirectUrl);
            
        } catch (Exception e) {
            log.error("카카오 로그인 처리 중 오류 발생", e);
            response.sendRedirect("/page/auth?error=login_failed");
        }
    }

}
