package com.stayswap.user.model.entity;

import com.stayswap.common.entity.BaseTimeEntity;
import com.stayswap.common.token.TokenInfo;
import com.stayswap.user.constant.Role;
import com.stayswap.user.constant.UserType;
import com.stayswap.util.DateTimeUtils;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseTimeEntity {

    @Id
    @Column(name = "user_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private UserType userType;

    @Column(nullable = false, unique = true, length = 50)
    private String email;

    @Column(length = 200)
    private String password;

    @Column(nullable = false, length = 20)
    private String userName;

    private String nickname;

    @Column(length = 200)
    private String profile;
    
    @Column(length = 500)
    private String introduction;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Role role;

    @Column(length = 250)
    private String refreshToken;

    private LocalDateTime tokenExpirationTime;

    public void updateRefreshToken(TokenInfo tokenInfo) {
        refreshToken = tokenInfo.getRefreshToken();
        tokenExpirationTime = DateTimeUtils.convertToLocalDateTime(tokenInfo.getRefreshTokenExpireTime());
    }

    public void updateRefreshTokenNow(LocalDateTime tokenExpirationTime) {
        this.tokenExpirationTime = tokenExpirationTime;
    }

    /**
     * 닉네임 수정
     */
    public void updateNickname(String nickname) {
        this.nickname = nickname;
    }
    
    /**
     * 소개 수정
     */
    public void updateIntroduction(String introduction) {
        this.introduction = introduction;
    }
}
