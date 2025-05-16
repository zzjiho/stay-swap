package com.stayswap.domains.user.model.dto.response;

import com.stayswap.domains.user.constant.Role;
import com.stayswap.domains.user.constant.UserType;
import com.stayswap.domains.user.model.entity.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Year;

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

    @Schema(description = "사용자 소개", example = "안녕하세요, 여행을 좋아하는 홍길동입니다.")
    private String introduction;

    @Schema(description = "사용자 타입", example = "KAKAO")
    private UserType userType;

    @Schema(description = "가입 년도", example = "2023")
    private Integer joinYear;
    
    @Schema(description = "받은 리뷰 개수", example = "15")
    private Long reviewCount;

    public static UserInfoResponse from(User user) {
        return UserInfoResponse.builder()
                .id(user.getId())
                .name(user.getUserName())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .profile(user.getProfile())
                .introduction(user.getIntroduction())
                .userType(user.getUserType())
                .build();
    }
    
    public static UserInfoResponse from(User user, Integer joinYear, Long reviewCount) {
        return UserInfoResponse.builder()
                .id(user.getId())
                .name(user.getUserName())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .profile(user.getProfile())
                .introduction(user.getIntroduction())
                .userType(user.getUserType())
                .joinYear(joinYear)
                .reviewCount(reviewCount)
                .build();
    }
} 