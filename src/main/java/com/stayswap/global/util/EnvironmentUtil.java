package com.stayswap.global.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class EnvironmentUtil {

    @Value("${kakao.client.id}")
    private String kakaoClientId;

    /**
   	 * Custom value - Kakao Client ID
   	 * */
   	public String getKakaoClientId() {
   		return kakaoClientId;
   	}

}
