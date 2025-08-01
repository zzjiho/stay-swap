package com.stayswap.test.controller;

import com.stayswap.common.resolver.userinfo.UserInfo;
import com.stayswap.common.resolver.userinfo.UserInfoDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/test/oauth2")
@Profile({"dev", "local"})
@Tag(name = "OAuth2 Test", description = "Spring Authorization Server 테스트 API")
public class OAuth2TestController {

    @Operation(summary = "JWT 토큰 정보 확인", description = "현재 인증된 JWT 토큰의 상세 정보를 확인합니다")
    @GetMapping("/token-info")
    public Map<String, Object> getTokenInfo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Map<String, Object> result = new HashMap<>();
        
        if (authentication instanceof JwtAuthenticationToken jwtAuth) {
            Jwt jwt = jwtAuth.getToken();
            
            result.put("tokenType", "JWT");
            result.put("subject", jwt.getSubject());
            result.put("issuer", jwt.getIssuer());
            result.put("audience", jwt.getAudience());
            result.put("expiresAt", jwt.getExpiresAt());
            result.put("issuedAt", jwt.getIssuedAt());
            result.put("claims", jwt.getClaims());
            result.put("authorities", jwtAuth.getAuthorities());
        } else {
            result.put("error", "No JWT authentication found");
            result.put("authenticationType", authentication != null ? authentication.getClass().getSimpleName() : "null");
        }
        
        return result;
    }

    @Operation(summary = "사용자 정보 확인", description = "@UserInfo 어노테이션을 통한 사용자 정보 추출 테스트")
    @GetMapping("/user-info")
    public Map<String, Object> getUserInfo(@UserInfo UserInfoDto userInfo) {
        Map<String, Object> result = new HashMap<>();
        
        if (userInfo != null) {
            result.put("success", true);
            result.put("userId", userInfo.getUserId());
            result.put("role", userInfo.getRole());
        } else {
            result.put("success", false);
            result.put("error", "UserInfo not available");
        }
        
        return result;
    }

    @Operation(summary = "선택적 사용자 정보", description = "required=false로 설정된 사용자 정보 테스트")
    @GetMapping("/optional-user-info")
    public Map<String, Object> getOptionalUserInfo(@UserInfo(required = false) UserInfoDto userInfo) {
        Map<String, Object> result = new HashMap<>();
        
        result.put("userInfoProvided", userInfo != null);
        if (userInfo != null) {
            result.put("userId", userInfo.getUserId());
            result.put("role", userInfo.getRole());
        }
        
        return result;
    }
}