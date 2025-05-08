package com.stayswap.resolver;

import com.stayswap.domains.user.constant.Role;
import com.stayswap.jwt.service.TokenManager;
import com.stayswap.resolver.userinfo.UserInfo;
import com.stayswap.resolver.userinfo.UserInfoDto;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;


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
        String token = authorizationHeader.split(" ")[1];

        Claims tokenClaims = tokenManager.getTokenClaims(token);
        Long userId = Long.valueOf((Integer) tokenClaims.get("userId"));
        String role = (String) tokenClaims.get("role");

        return UserInfoDto.builder()
                .userId(userId)
                .role(Role.from(role))
                .build();
    }

}
