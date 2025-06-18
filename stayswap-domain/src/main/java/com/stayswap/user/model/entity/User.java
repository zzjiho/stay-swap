package com.stayswap.user.model.entity;

import com.stayswap.common.entity.BaseTimeEntity;
import com.stayswap.house.model.entity.HouseLike;
import com.stayswap.jwt.constant.Role;
import com.stayswap.jwt.dto.JwtTokenDto;
import com.stayswap.user.constant.UserType;
import com.stayswap.util.DateTimeUtils;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Builder
@AllArgsConstructor
@Table(name = "`user`")
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
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @Builder.Default
    private List<HouseLike> houseLikes = new ArrayList<>();

    public void updateRefreshToken(JwtTokenDto jwtTokenDto) {
        refreshToken = jwtTokenDto.getRefreshToken();
        tokenExpirationTime = DateTimeUtils.convertToLocalDateTime(jwtTokenDto.getRefreshTokenExpireTime());
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
