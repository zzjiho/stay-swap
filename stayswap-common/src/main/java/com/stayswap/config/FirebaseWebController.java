package com.stayswap.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 클라이언트에 Firebase 설정 정보를 제공하는 컨트롤러
 */
@RestController
@RequestMapping("/api/config")
@RequiredArgsConstructor
public class FirebaseWebController {

    @Value("${firebase.config.api-key}")
    private String apiKey;

    @Value("${firebase.config.auth-domain}")
    private String authDomain;

    @Value("${firebase.config.project-id}")
    private String projectId;

    @Value("${firebase.config.storage-bucket}")
    private String storageBucket;

    @Value("${firebase.config.messaging-sender-id}")
    private String messagingSenderId;

    @Value("${firebase.config.app-id}")
    private String appId;

    @Value("${firebase.config.measurement-id}")
    private String measurementId;

    @Value("${firebase.config.vapid-key}")
    private String vapidKey;

    /**
     * Firebase 설정 정보를 제공하는 API
     */
    @GetMapping("/firebase")
    public ResponseEntity<FirebaseConfigDto> getFirebaseConfig() {
        FirebaseConfigDto config = FirebaseConfigDto.builder()
                .apiKey(apiKey)
                .authDomain(authDomain)
                .projectId(projectId)
                .storageBucket(storageBucket)
                .messagingSenderId(messagingSenderId)
                .appId(appId)
                .measurementId(measurementId)
                .vapidKey(vapidKey)
                .build();

        return ResponseEntity.ok(config);
    }
} 