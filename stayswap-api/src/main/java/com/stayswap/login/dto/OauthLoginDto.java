package com.stayswap.login.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonGetter;
import com.stayswap.jwt.dto.JwtTokenDto;
import com.stayswap.util.TokenMaskingUtil;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;

public class OauthLoginDto {

    @Getter @Setter
    public static class Request {
        @Schema(description = "소셜 로그인 회원 타입", example = "KAKAO", required = true)
        private String userType;
    }

    @Getter @Setter @Builder
    public static class Response {
        @Schema(description = "grantType", example = "Bearer", required = true)
        private String grantType;

        @Schema(description = "accessToken", example = "eyJ0eXAiOiJKV1QiLCJhbGDiOJqIUzUxMiJ9.eyJzdWIiOiJBQ0NFU1MiLCJpYXQiOjE3MDQ1NTU3NzAsImV4cCI6MTcwNDU1NjY3MCwibWVtYmVySWQiOjEsInJvbGUiOiJBRE1JTiJ9.PIio3HBYoHS3TGfZpHsOfHHvqZM-JN5YLXcktqSUbsCm4HOO1KjUou3gY8j5KQuKytiK5IrMC7hWbA4ADYx-SQ", required = true)
        private String accessToken;

        @Schema(description = "access token 만료 시간", example = "2024-03-28 00:57:50", required = true)
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
        private Date accessTokenExpireTime;

        @Schema(description = "refreshToken", example = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJSRUZSRVNIIiwiaWF0IjoxNzA0NTU1NzcwLCJleHAiOjE3MDU3NjUzNzAsIm1lbWJlcklkIjoxfQ.koZEtQ8zJIRE7xocW34w61wds2NQbiMoHRkawUXfWUjXFAR2iEzswacBAol_quwENpwiNA23BP-8nQm8jt85g", required = true)
        private String refreshToken;

        @Schema(description = "refresh token 만료 시간", example = "2024-04-07 00:57:50", required = true)
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
        private Date refreshTokenExpireTime;

        public static Response of(JwtTokenDto jwtTokenDto) {
            return Response.builder()
                    .grantType(jwtTokenDto.getGrantType())
                    .accessToken(jwtTokenDto.getAccessToken())
                    .accessTokenExpireTime(jwtTokenDto.getAccessTokenExpireTime())
                    .refreshToken(jwtTokenDto.getRefreshToken())
                    .refreshTokenExpireTime(jwtTokenDto.getRefreshTokenExpireTime())
                    .build();
        }
    }
}
