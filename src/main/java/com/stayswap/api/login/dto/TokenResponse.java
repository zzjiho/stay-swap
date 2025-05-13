package com.stayswap.api.login.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonGetter;
import com.stayswap.util.TokenMaskingUtil;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;

@Getter
@Setter
@Builder
public class TokenResponse {

    @Schema(description = "grantType", example = "Bearer", required = true)
    private String grantType;

    @Schema(description = "accessToken", example = "eyJ0eXAiOiJKV1QiLCJhbGDiOJqIUzUxMiJ9.Q", required = true)
    private String accessToken;

    @Schema(description = "access token 만료 시간", example = "1997-01-01 00:57:50", required = true)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
    private Date accessTokenExpireTime;

    @Schema(description = "refreshToken", example = "eyJ0eXAiOiJKV1QiLCJhbGDiOJqIUzUxMiJ9.Q", required = true)
    private String refreshToken;

    @Schema(description = "refresh token 만료 시간", example = "1997-01-15 00:57:50", required = true)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
    private Date refreshTokenExpireTime;

    public TokenResponse(String grantType, String accessToken, Date accessTokenExpireTime, String refreshToken, Date refreshTokenExpireTime) {
        this.grantType = grantType;
        this.accessToken = accessToken;
        this.accessTokenExpireTime = accessTokenExpireTime;
        this.refreshToken = refreshToken;
        this.refreshTokenExpireTime = refreshTokenExpireTime;
    }

    /**
     * JSON 직렬화 시 accessToken을 마스킹 처리
     * @return 마스킹된 accessToken
     */
//    @JsonGetter("accessToken")
//    public String getMaskedAccessToken() {
//        return TokenMaskingUtil.maskAccessToken(accessToken);
//    }
    
    /**
     * JSON 직렬화 시 refreshToken을 마스킹 처리
     * @return 마스킹된 refreshToken
     */
    @JsonGetter("refreshToken")
    public String getMaskedRefreshToken() {
        return TokenMaskingUtil.maskRefreshToken(refreshToken);
    }
}
