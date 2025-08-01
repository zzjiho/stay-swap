package com.stayswap.login.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

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

    

    public TokenResponse(String grantType, String accessToken, Date accessTokenExpireTime) {
        this.grantType = grantType;
        this.accessToken = accessToken;
        this.accessTokenExpireTime = accessTokenExpireTime;
    }

    /**
     * JSON 직렬화 시 accessToken을 마스킹 처리
     * @return 마스킹된 accessToken
     */
//    @JsonGetter("accessToken")
//    public String getMaskedAccessToken() {
//        return TokenMaskingUtil.maskAccessToken(accessToken);
//    }
    
    
}
