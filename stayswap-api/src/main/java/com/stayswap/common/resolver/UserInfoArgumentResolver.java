package com.stayswap.common.resolver;

import com.stayswap.jwt.service.TokenManager;
import com.stayswap.common.resolver.userinfo.UserInfo;
import com.stayswap.common.resolver.userinfo.UserInfoDto;
import com.stayswap.jwt.constant.Role;
import com.stayswap.error.exception.AuthenticationException;
import com.stayswap.code.ErrorCode;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;


@Slf4j
@Component
@RequiredArgsConstructor
public class UserInfoArgumentResolver implements HandlerMethodArgumentResolver {

    private final TokenManager tokenManager;

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        boolean hasUserInfoAnnotation = parameter.hasParameterAnnotation(UserInfo.class);
        boolean hasUserInfoDto = UserInfoDto.class.isAssignableFrom(parameter.getParameterType());
        return hasUserInfoAnnotation && hasUserInfoDto;
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer, NativeWebRequest webRequest, WebDataBinderFactory binderFactory) throws Exception {
        HttpServletRequest request = (HttpServletRequest) webRequest.getNativeRequest();
        String authorizationHeader = request.getHeader("Authorization");
        
        // UserInfo 어노테이션에서 required 값 확인
        UserInfo userInfoAnnotation = parameter.getParameterAnnotation(UserInfo.class);
        boolean required = userInfoAnnotation != null ? userInfoAnnotation.required() : true;
        
        // Authorization 헤더가 없거나 Bearer 토큰이 아닌 경우
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            if (required) {
                throw new AuthenticationException(ErrorCode.NOT_EXISTS_AUTHORIZATION);
            }
            log.debug("Authorization header is missing, but required=false, returning null");
            return null;
        }
        
        try {
            String token = authorizationHeader.split(" ")[1];
            Claims tokenClaims = tokenManager.getTokenClaims(token);
            Long userId = Long.valueOf((Integer) tokenClaims.get("userId"));
            String role = (String) tokenClaims.get("role");

            UserInfoDto userInfoDto = UserInfoDto.builder()
                    .userId(userId)
                    .role(Role.from(role))
                    .build();
            
            return userInfoDto;
        } catch (Exception e) {
            if (required) {
                log.error("Failed to resolve user info from token", e);
                throw e;
            }
            log.debug("Failed to resolve user info from token, but required=false, returning null", e);
            return null;
        }
    }
}
