package com.stayswap.common.resolver;

import com.stayswap.common.resolver.userinfo.UserInfo;
import com.stayswap.common.resolver.userinfo.UserInfoDto;
import com.stayswap.jwt.constant.Role;
import com.stayswap.error.exception.AuthenticationException;
import com.stayswap.code.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.MethodParameter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;


@Slf4j
@Component
@RequiredArgsConstructor
public class UserInfoArgumentResolver implements HandlerMethodArgumentResolver {

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        boolean hasUserInfoAnnotation = parameter.hasParameterAnnotation(UserInfo.class);
        boolean hasUserInfoDto = UserInfoDto.class.isAssignableFrom(parameter.getParameterType());
        return hasUserInfoAnnotation && hasUserInfoDto;
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer, NativeWebRequest webRequest, WebDataBinderFactory binderFactory) throws Exception {
        
        // UserInfo 어노테이션에서 required 값 확인
        UserInfo userInfoAnnotation = parameter.getParameterAnnotation(UserInfo.class);
        boolean required = userInfoAnnotation != null ? userInfoAnnotation.required() : true;
        
        // Spring Security Context에서 JWT 토큰을 확인
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication instanceof JwtAuthenticationToken jwtAuth) {
            try {
                Jwt jwt = jwtAuth.getToken();
                
                Long userId = Long.parseLong(jwt.getSubject());
                String role = jwt.getClaimAsString("role");
                
                if (userId != null) {
                    UserInfoDto userInfoDto = UserInfoDto.builder()
                            .userId(userId)
                            .role(role != null ? Role.from(role.startsWith("ROLE_") ? role : "ROLE_" + role) : Role.ROLE_USER)
                            .build();
                    
                    return userInfoDto;
                }
            } catch (Exception e) {
                log.warn("Spring Security JWT 유저 정보 extract 실패 ", e);
            }
        }
        
        // 토큰이 없거나 파싱에 실패한 경우
        if (required) {
            throw new AuthenticationException(ErrorCode.NOT_EXISTS_AUTHORIZATION);
        }
        
        return null;
    }
}
