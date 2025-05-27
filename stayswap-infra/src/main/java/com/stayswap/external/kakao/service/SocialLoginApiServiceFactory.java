package com.stayswap.external.kakao.service;

import com.stayswap.external.service.SocialLoginApiService;
import com.stayswap.user.constant.UserType;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class SocialLoginApiServiceFactory {

    //map에 소셜 로그인 API서비스 구현체가 각각 들어가게 된다.
    private static Map<String, SocialLoginApiService> socialLoginApiServices;

    public SocialLoginApiServiceFactory(Map<String, SocialLoginApiService> socialLoginApiServices) {
        this.socialLoginApiServices = socialLoginApiServices;
    }

    /**
     * 구현체 갖고오기
     */
    public static SocialLoginApiService getSocialLoginApiService(UserType userType) {
        String socialLoginApiServiceBeanName = "";

        if (UserType.KAKAO.equals(userType)) { //카카오면
            socialLoginApiServiceBeanName = "kakaoLoginApiServiceImpl"; //카카오 로그인 api서비스 구현체
        }

        return socialLoginApiServices.get(socialLoginApiServiceBeanName);
    }



}
