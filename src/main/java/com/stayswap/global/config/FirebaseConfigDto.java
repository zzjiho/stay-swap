package com.stayswap.global.config;

import lombok.Builder;
import lombok.Getter;

/**
 * Firebase 설정 정보를 클라이언트에 제공하기 위한 DTO
 */
@Getter
@Builder
public class FirebaseConfigDto {
    private String apiKey;
    private String authDomain;
    private String projectId;
    private String storageBucket;
    private String messagingSenderId;
    private String appId;
    private String measurementId;
    private String vapidKey;
} 