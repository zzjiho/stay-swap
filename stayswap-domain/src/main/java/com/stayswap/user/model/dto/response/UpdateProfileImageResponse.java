package com.stayswap.user.model.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class UpdateProfileImageResponse {

    @Schema(description = "업데이트된 프로필 이미지 URL", example = "https://s3.amazonaws.com/bucket/image/profile_123.jpg")
    private String profileImageUrl;

    public static UpdateProfileImageResponse of(String profileImageUrl) {
        return UpdateProfileImageResponse.builder()
                .profileImageUrl(profileImageUrl)
                .build();
    }
} 