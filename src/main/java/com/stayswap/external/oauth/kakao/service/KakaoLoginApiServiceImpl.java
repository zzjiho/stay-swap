package com.stayswap.external.oauth.kakao.service;

import com.stayswap.domains.user.constant.UserType;
import com.stayswap.external.oauth.kakao.client.KakaoUserInfoClient;
import com.stayswap.external.oauth.kakao.dto.KakaoUserInfoResponseDto;
import com.stayswap.external.oauth.model.OAuthAttributes;
import com.stayswap.external.oauth.service.SocialLoginApiService;
import com.stayswap.jwt.constant.GrantType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class KakaoLoginApiServiceImpl implements SocialLoginApiService {

    private final KakaoUserInfoClient kakaoUserInfoClient;
    private final String CONTENT_TYPE = "application/x-www-form-urlencoded;charset=utf-8";

    @Override
    public OAuthAttributes getUserInfo(String accessToken) {
        KakaoUserInfoResponseDto kakaoUserInfoResponseDto =
                kakaoUserInfoClient.getKakaoUserInfo(CONTENT_TYPE,
                                          GrantType.BEARER.getType() + " " + accessToken);

        KakaoUserInfoResponseDto.KakaoAccount kakaoAccount = kakaoUserInfoResponseDto.getKakaoAccount();
        String email = kakaoAccount.getEmail();

        return OAuthAttributes.builder()
                .email(!StringUtils.hasText(email) ? kakaoUserInfoResponseDto.getId() : email)
                .name(kakaoAccount.getProfile().getNickname())
                .profile(kakaoAccount.getProfile().getThumbnailImageUrl())
                .userType(UserType.KAKAO)
                .build();
    }
}
