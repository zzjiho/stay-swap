package com.stayswap.web.kakaotoken.controller;

import com.stayswap.global.error.exception.Custom404Exception;
import com.stayswap.global.util.EnvironmentUtil;
import com.stayswap.web.kakaotoken.client.KakaoTokenClient;
import com.stayswap.web.kakaotoken.dto.KakaoTokenDto;
import com.stayswap.web.kakaotoken.util.KakaoApiUtil;
import com.stayswap.web.kakaotoken.util.RequestUrlUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.io.IOException;

@Slf4j
@Controller
@RequiredArgsConstructor
public class KakaoTokenController {

    private final EnvironmentUtil env;
    private final KakaoTokenClient kakaoTokenClient;

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
    public ResponseEntity<KakaoTokenDto.Response> loginCallback(
            HttpServletRequest request,
            @RequestParam("code") String code) {

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

        return ResponseEntity.ok(kakaoToken);
    }

}
