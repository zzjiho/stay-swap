package com.stayswap.common.config.firebase;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;

@Slf4j
@Getter
@Configuration
public class FirebaseConfig {

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

    private static final String FCM_CREDENTIAL_PATH = "fcm/stay-swap-firebase-adminsdk-fbsvc-2f94ce1f1f.json";

    @Bean
    public FirebaseMessaging firebaseMessaging() throws IOException {
        GoogleCredentials googleCredentials = GoogleCredentials
                .fromStream(new ClassPathResource(FCM_CREDENTIAL_PATH).getInputStream());

        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(googleCredentials)
                .setProjectId(projectId)
                .build();

        if (FirebaseApp.getApps().isEmpty()) {
            FirebaseApp app = FirebaseApp.initializeApp(options);
            log.info("Firebase 앱 초기화 완료: {}", app.getName());
            return FirebaseMessaging.getInstance(app);
        }
        
        return FirebaseMessaging.getInstance();
    }
} 