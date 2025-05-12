package com.stayswap.domains.user.model.dto.response;

import com.stayswap.domains.user.constant.Role;
import com.stayswap.domains.user.constant.UserType;
import com.stayswap.domains.user.model.entity.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class UserInfoResponse {

    @Schema(description = "사용자 ID", example = "1")
    private Long id;

    @Schema(description = "사용자 이름", example = "홍길동")
    private String name;

    @Schema(description = "사용자 이메일", example = "user@example.com")
    private String email;

    @Schema(description = "사용자 닉네임", example = "행복한사자")
    private String nickname;

    @Schema(description = "프로필 이미지 URL", example = "http://example.com/profile.jpg")
    private String profile;

    @Schema(description = "사용자 타입", example = "KAKAO")
    private UserType userType;

    @Schema(description = "사용자 역할", example = "ROLE_USER")
    private Role role;

    public static UserInfoResponse from(User user) {
        return UserInfoResponse.builder()
                .id(user.getId())
                .name(user.getUserName())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .profile(user.getProfile())
                .userType(user.getUserType())
                .role(user.getRole())
                .build();
    }
} 