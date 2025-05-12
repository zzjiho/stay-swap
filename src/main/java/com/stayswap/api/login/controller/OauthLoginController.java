package com.stayswap.api.login.controller;

import com.stayswap.api.login.dto.OauthLoginDto;
import com.stayswap.api.login.service.OauthLoginService;
import com.stayswap.api.login.validator.OauthValidator;
import com.stayswap.domains.user.constant.UserType;
import com.stayswap.global.util.AuthorizationHeaderUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/oauth")
@Tag(name = "authentication", description = "로그인/로그아웃/토큰재발급 API")
public class OauthLoginController {

    private final OauthValidator oauthValidator;
    private final OauthLoginService oauthLoginService;

    @Tag(name = "authentication")
    @Operation(summary = "소셜 로그인 API", description = "소셜 로그인 API")
    @PostMapping("/login")
    public ResponseEntity<OauthLoginDto.Response> oauthLogin(@RequestBody OauthLoginDto.Request oauthLoginRequestDto,
                                                             HttpServletRequest httpServletRequest,
                                                             HttpServletResponse httpServletResponse) {

        String authorizationHeader = httpServletRequest.getHeader("Authorization");
        AuthorizationHeaderUtils.validateAuthorization(authorizationHeader);
        oauthValidator.validateUserType(oauthLoginRequestDto.getUserType());

        String accessToken = authorizationHeader.split(" ")[1]; //Bearer 다음에 오는 토큰

        OauthLoginDto.Response jwtTokenResponseDto =
                oauthLoginService.oauthLogin(accessToken, UserType.from(oauthLoginRequestDto.getUserType()));

        // refreshToken을 HttpOnly 쿠키로 설정
        Cookie refreshTokenCookie = new Cookie("refreshToken", jwtTokenResponseDto.getRefreshToken());
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setPath("/");
        // 쿠키 만료 시간 설정 (refreshToken 만료 시간과 동일하게)
        long maxAge = (jwtTokenResponseDto.getRefreshTokenExpireTime().getTime() - System.currentTimeMillis()) / 1000;
        refreshTokenCookie.setMaxAge((int) maxAge);
        
        // HTTPS 환경에서는 Secure 플래그 활성화 (프로덕션 환경에서 사용)
        // refreshTokenCookie.setSecure(true);
        
        httpServletResponse.addCookie(refreshTokenCookie);

        // 응답에서 refreshToken 제외 (쿠키로 전달했으므로)
        OauthLoginDto.Response responseWithoutRefreshToken = OauthLoginDto.Response.builder()
                .grantType(jwtTokenResponseDto.getGrantType())
                .accessToken(jwtTokenResponseDto.getAccessToken())
                .accessTokenExpireTime(jwtTokenResponseDto.getAccessTokenExpireTime())
                .build();

        return ResponseEntity.ok(responseWithoutRefreshToken);
    }
}
