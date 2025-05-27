package com.stayswap.login.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;

@Getter
public class RefreshTokenRequest {

    @Schema(description = "refreshToken", example = "eyJ0eXAiOiJKV1QiLCJhbGDiOJqIUzUxMiJ9.Q", required = true)
    private String refreshToken;
}
