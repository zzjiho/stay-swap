package com.stayswap.global.interceptor;

import com.stayswap.global.code.ErrorCode;
import com.stayswap.global.error.exception.AuthenticationException;
import com.stayswap.global.util.AuthorizationHeaderUtils;
import com.stayswap.jwt.constant.TokenType;
import com.stayswap.jwt.service.TokenManager;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import static com.stayswap.global.code.ErrorCode.*;


@Component
@RequiredArgsConstructor
public class AuthenticationInterceptor implements HandlerInterceptor {

    private final TokenManager tokenManager;

    //preHandle() 메서드는 컨트롤러보다 먼저 수행
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String requestURI = request.getRequestURI();


        // Authorization Header 검증
        String authorizationHeader = request.getHeader("Authorization");
        AuthorizationHeaderUtils.validateAuthorization(authorizationHeader);

        // refreshToken으로 accessToken 재발급시에는 검증 생략
        if (requestURI.equals("/api/access-token/issue2")) {
            return true;
        }

        // 토큰 검증
        String accessToken = authorizationHeader.split(" ")[1];
        tokenManager.validateToken(accessToken);

        // 토큰 타입
        Claims tokenClaims = tokenManager.getTokenClaims(accessToken); // 토큰의 내용을 조회
        String tokenType = tokenClaims.getSubject(); // 토큰의 타입을 조회

        if (!TokenType.isAccessToken(tokenType)) {
            throw new AuthenticationException(NOT_ACCESS_TOKEN_TYPE);
        }

        return true;
    }
}
