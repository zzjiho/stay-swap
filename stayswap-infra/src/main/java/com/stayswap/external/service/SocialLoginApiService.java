package com.stayswap.external.service;


import com.stayswap.external.model.OAuthAttributes;

public interface SocialLoginApiService {

    OAuthAttributes getUserInfo(String accessToken);
}
