package com.stayswap.kakaotoken.util;

import org.springframework.web.util.UriComponents;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

public class KakaoApiUtil {

	/**
	 * Kakao <-> 개발 Application 인증 요청 URL
	 * */
	public static String getKakaoAuthorizeURL(String clientId, String redirectUri) {

		UriComponents uriComponents = UriComponentsBuilder
			.fromUri(URI.create("https://kauth.kakao.com/oauth/authorize"))
			.queryParam("response_type"	, "code")
			.queryParam("client_id"		, clientId)
			.queryParam("redirect_uri"	, redirectUri)
			.build();

		return uriComponents.toUriString();
	}


}
