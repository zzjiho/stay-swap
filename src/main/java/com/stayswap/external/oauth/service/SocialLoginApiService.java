package com.stayswap.external.oauth.service;


import com.stayswap.external.oauth.model.OAuthAttributes;

public interface SocialLoginApiService {

    OAuthAttributes getUserInfo(String accessToken);
}
