package com.stayswap.login.external.service;


import com.stayswap.login.external.model.OAuthAttributes;

public interface SocialLoginApiService {

    OAuthAttributes getUserInfo(String accessToken);
}
