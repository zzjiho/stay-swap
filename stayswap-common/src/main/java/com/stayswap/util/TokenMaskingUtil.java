package com.stayswap.util;

/**
 * 토큰 마스킹 기능을 제공하는 유틸리티 클래스
 */
public class TokenMaskingUtil {

    /**
     * Access Token 마스킹 처리
     */
    public static String maskAccessToken(String accessToken) {
        if (accessToken == null) {
            return null;
        }
        
        if (accessToken.length() > 20 && accessToken.startsWith("eyJ")) {
            return accessToken.substring(0, 10) + "..." +
                   accessToken.substring(accessToken.length() - 5);
        }
        
        // 기본 마스킹 처리
        return accessToken.length() > 8 ? 
               accessToken.substring(0, 4) + "..." + 
               accessToken.substring(accessToken.length() - 4) : "***masked***";
    }
    
    /**
     * Refresh Token 마스킹 처리
     */
    public static String maskRefreshToken(String refreshToken) {
        if (refreshToken == null) {
            return null;
        }
        
        if (refreshToken.length() > 15) {
            return refreshToken.substring(0, 5) + "..." + 
                   refreshToken.substring(refreshToken.length() - 5);
        }
        
        return "***masked***";
    }
} 