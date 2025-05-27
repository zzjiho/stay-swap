package com.stayswap.login.service;

import com.stayswap.external.kakao.service.SocialLoginApiServiceFactory;
import com.stayswap.external.model.OAuthAttributes;
import com.stayswap.external.service.SocialLoginApiService;
import com.stayswap.login.dto.OauthLoginDto;
import com.stayswap.user.constant.Role;
import com.stayswap.user.constant.UserType;
import com.stayswap.user.model.entity.User;
import com.stayswap.external.oauth.kakao.service.SocialLoginApiServiceFactory;
import com.stayswap.external.oauth.model.OAuthAttributes;
import com.stayswap.external.oauth.service.SocialLoginApiService;
import com.stayswap.jwt.dto.JwtTokenDto;
import com.stayswap.jwt.service.TokenManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;


@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class OauthLoginService {

    private final com.stayswap.user.service.UserService userService;
    private final TokenManager tokenManager;

    public OauthLoginDto.Response oauthLogin(String accessToken, UserType userType) {
        SocialLoginApiService socialLoginApiService = SocialLoginApiServiceFactory.getSocialLoginApiService(userType); //어떤 social인지
        OAuthAttributes userInfo = socialLoginApiService.getUserInfo(accessToken);
        log.info("userInfo : {}", userInfo);

        JwtTokenDto jwtTokenDto;

        Optional<User> optionalUser = userService.findUserByEmail(userInfo.getEmail());
        //신규 회원가입
        if (optionalUser.isEmpty()) {
            String nickname = userService.generateRandomNickname();
            User oauthUser = userInfo.toUserEntity(userType, Role.ROLE_USER, nickname);
            oauthUser = userService.registerUser(oauthUser);

            //토큰 생성
            jwtTokenDto = tokenManager.createJwtTokenDto(oauthUser.getId(), oauthUser.getRole());
            oauthUser.updateRefreshToken(jwtTokenDto);
        } else { //기존 회원일 경우
            User oauthUser = optionalUser.get();

            //토큰 생성
            jwtTokenDto = tokenManager.createJwtTokenDto(oauthUser.getId(), oauthUser.getRole());
            oauthUser.updateRefreshToken(jwtTokenDto);
        }

        return OauthLoginDto.Response.of(jwtTokenDto);
    }

}
