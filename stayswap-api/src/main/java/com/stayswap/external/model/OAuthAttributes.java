package com.stayswap.external.model;

import com.stayswap.jwt.constant.Role;
import com.stayswap.user.constant.UserType;
import com.stayswap.user.model.entity.User;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

/**
 * 소셜 플랫폼에서 갖고온 회원정보를 하나로 통일시켜
 * 회원 가입시 여기있는 정보를 이용해서 회원가입
 */
@Getter
@Builder
@ToString
public class OAuthAttributes {

    private String name;
    private String email;
    private String profile;
    private UserType userType;
    private String nickname;

    public User toUserEntity(UserType userType, Role role, String nickname) {
        return User.builder()
                .userName(name)
                .email(email)
                .nickname(nickname)
                .userType(userType)
                .profile(profile)
                .role(role)
                .build();
    }

}
