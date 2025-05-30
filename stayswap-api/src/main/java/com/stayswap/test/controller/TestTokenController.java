package com.stayswap.test.controller;

import com.stayswap.jwt.dto.JwtTokenDto;
import com.stayswap.jwt.service.TokenManager;
import com.stayswap.test.dto.TestTokenRequest;
import com.stayswap.user.model.entity.User;
import com.stayswap.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/test")
@Profile({"dev", "local"})
public class TestTokenController {

    private final TokenManager tokenManager;
    private final UserRepository userRepository;

    /**
     * 테스트용 토큰 발급 API
     * userId를 기반으로 accessToken과 refreshToken을 생성하여 반환합니다.
     */
    @PostMapping("/token")
    public JwtTokenDto generateTestToken(@RequestBody TestTokenRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다: " + request.getUserId()));
        
        // 토큰 생성
        JwtTokenDto jwtTokenDto = tokenManager.createJwtTokenDto(user.getId(), user.getRole());
        
        // 사용자의 refreshToken 업데이트 (선택사항)
        user.updateRefreshToken(jwtTokenDto);
        userRepository.save(user);
        
        return jwtTokenDto;
    }
}