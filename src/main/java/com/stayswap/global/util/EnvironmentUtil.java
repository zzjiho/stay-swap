package com.stayswap.global.util;

import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EnvironmentUtil {

    private final Environment env;

    /**
   	 * Custom value - Kakao Client ID
   	 * */
   	public String getKakaoClientId() {
   		return env.getProperty("kakao.client.id");
   	}

}
