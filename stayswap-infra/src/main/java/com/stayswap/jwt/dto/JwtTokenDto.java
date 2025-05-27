package com.stayswap.jwt.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.stayswap.common.token.TokenInfo;
import lombok.Builder;
import lombok.Getter;

import java.util.Date;

@Getter
@Builder
public class JwtTokenDto implements TokenInfo {

    private String grantType;

    private String accessToken;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
    private Date accessTokenExpireTime;

    private String refreshToken;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
    private Date refreshTokenExpireTime;

    @Override
    public String getRefreshToken() {
        return refreshToken;
    }

    @Override
    public Date getRefreshTokenExpireTime() {
        return refreshTokenExpireTime;
    }
}
