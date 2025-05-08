package com.stayswap.api.login.service;

import com.stayswap.api.login.dto.TokenResponse;
import com.stayswap.domains.user.model.entity.User;
import com.stayswap.domains.user.service.UserService;
import com.stayswap.jwt.constant.GrantType;
import com.stayswap.jwt.dto.JwtTokenDto;
import com.stayswap.jwt.service.TokenManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Date;

@Service
@Transactional
@RequiredArgsConstructor
public class TokenService {

    private final UserService userService;
    private final TokenManager tokenManager;

    public TokenResponse createAccessTokenByRefreshToken(String refreshToken) {
        User user = userService.findUserByRefreshToken(refreshToken);
        Date accessTokenExpirationTime = tokenManager.createAccessTokenExpireTime();
        String accessToken = tokenManager.createAccessToken(user.getId(), user.getRole(), accessTokenExpirationTime);

        // accessToken 재발급시 refreshToken 하루남은 사용자만 update.
        if (user.getTokenExpirationTime() != null &&
                Duration.between(LocalDateTime.now(), user.getTokenExpirationTime()).toMillis() < 1000 * 60 * 60 * 24) {
            JwtTokenDto jwtTokenDto = tokenManager.createRefreshTokenDto(user.getId());
            user.updateRefreshToken(jwtTokenDto);

            return TokenResponse.builder()
                    .grantType(GrantType.BEARER.getType())
                    .accessToken(accessToken)
                    .accessTokenExpireTime(accessTokenExpirationTime)
                    .refreshToken(jwtTokenDto.getRefreshToken())
                    .refreshTokenExpireTime(jwtTokenDto.getRefreshTokenExpireTime())
                    .build();
        }

        return TokenResponse.builder()
                .grantType(GrantType.BEARER.getType())
                .accessToken(accessToken)
                .accessTokenExpireTime(accessTokenExpirationTime)
                .build();
    }
}