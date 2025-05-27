package com.stayswap.interceptor;

import com.stayswap.error.exception.AuthenticationException;
import com.stayswap.jwt.constant.TokenType;
import com.stayswap.jwt.service.TokenManager;
import com.stayswap.util.AuthorizationHeaderUtils;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;

import static com.stayswap.code.ErrorCode.*;


@Slf4j
@Component
@RequiredArgsConstructor
public class AuthenticationInterceptor implements HandlerInterceptor {

    private final TokenManager tokenManager;

    //preHandle() 메서드는 컨트롤러보다 먼저 수행
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String requestURI = request.getRequestURI();
        log.debug("AuthenticationInterceptor preHandle URI: {}", requestURI);

        // 인증 예외 URI 패턴 확인 (WebConfig에 설정되어 있지만 여기서도 이중 확인)
        if (requestURI.equals("/api/token/refresh") || 
            requestURI.equals("/api/oauth/login") || 
            requestURI.equals("/api/logout") ||
            requestURI.startsWith("/v3/api-docs") ||
            requestURI.equals("/api/health-check")) {
            return true;
        }

        // Authorization Header 검증
        String authorizationHeader = request.getHeader("Authorization");
        
        // 헤더가 없거나 비어있는 경우 처리
        if (!StringUtils.hasText(authorizationHeader)) {
            log.warn("Authorization 헤더가 없거나 비어있습니다. URI: {}", requestURI);
            throw new AuthenticationException(NOT_EXISTS_AUTHORIZATION);
        }
        
        // Authorization 헤더 검증
        try {
            AuthorizationHeaderUtils.validateAuthorization(authorizationHeader);
        } catch (AuthenticationException e) {
            log.warn("Authorization 헤더 검증 실패: {}, URI: {}", e.getMessage(), requestURI);
            throw e;
        }

        // 토큰 추출 및 검증
        String accessToken = authorizationHeader.split(" ")[1];
        try {
            tokenManager.validateToken(accessToken);
        } catch (AuthenticationException e) {
            log.warn("토큰 검증 실패: {}, URI: {}", e.getMessage(), requestURI);
            throw e;
        }

        // 토큰 타입 검증
        try {
            Claims tokenClaims = tokenManager.getTokenClaims(accessToken); // 토큰의 내용을 조회
            String tokenType = tokenClaims.getSubject(); // 토큰의 타입을 조회

            if (!TokenType.isAccessToken(tokenType)) {
                log.warn("유효하지 않은 토큰 타입: {}, URI: {}", tokenType, requestURI);
                throw new AuthenticationException(NOT_ACCESS_TOKEN_TYPE);
            }
        } catch (AuthenticationException e) {
            log.warn("토큰 타입 검증 실패: {}, URI: {}", e.getMessage(), requestURI);
            throw e;
        } catch (Exception e) {
            log.error("토큰 처리 중 예기치 않은 오류 발생: {}, URI: {}", e.getMessage(), requestURI);
            throw new AuthenticationException(NOT_VALID_TOKEN);
        }

        return true;
    }
}
