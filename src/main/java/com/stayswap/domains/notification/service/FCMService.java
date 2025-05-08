package com.stayswap.domains.notification.service;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.*;
import com.stayswap.domains.notification.constant.NotificationType;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class FCMService {

    private static final String FCM_CREDENTIAL_PATH = "fcm/stay-swap-firebase-adminsdk-fbsvc-2f94ce1f1f.json";

    /**
     * Firebase 초기화
     */
    @PostConstruct
    public void initialize() {
        try {
            GoogleCredentials googleCredentials = GoogleCredentials
                    .fromStream(new ClassPathResource(FCM_CREDENTIAL_PATH).getInputStream());
            
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(googleCredentials)
                    .build();
            
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                log.info("Firebase 초기화 완료");
            }
        } catch (IOException e) {
            log.error("Firebase 초기화 실패", e);
            throw new RuntimeException("Firebase 초기화 중 오류가 발생했습니다.", e);
        }
    }

    /**
     * FCM 푸시 알림 전송
     */
    public void sendPushNotification(String token, String title, String body, 
                                    NotificationType type, Long referenceId) {
        try {
            // 알림 데이터 설정
            Map<String, String> data = new HashMap<>();
            data.put("type", type.name());
            data.put("referenceId", String.valueOf(referenceId));
            
            // 알림 메시지 구성
            Message message = Message.builder()
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .putAllData(data)
                    .setToken(token)
                    .build();
            
            // 알림 전송
            String response = FirebaseMessaging.getInstance().send(message);
            log.info("FCM 알림 전송 완료: {}", response);
            
        } catch (FirebaseMessagingException e) {
            log.error("FCM 알림 전송 실패", e);
        }
    }

    /**
     * 다중 기기에 FCM 푸시 알림 전송
     */
    public void sendMulticastPushNotification(
            String title, String body, NotificationType type, Long referenceId, String... tokens) {
        try {
            // 알림 대상이 없는 경우
            if (tokens.length == 0) {
                return;
            }
            
            // 알림 데이터 설정
            Map<String, String> data = new HashMap<>();
            data.put("type", type.name());
            data.put("referenceId", String.valueOf(referenceId));
            
            // 멀티캐스트 알림 메시지 구성
            MulticastMessage message = MulticastMessage.builder()
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .putAllData(data)
                    .addAllTokens(java.util.Arrays.asList(tokens))
                    .build();
            
            // 알림 전송
            BatchResponse response = FirebaseMessaging.getInstance().sendMulticast(message);
            log.info("FCM 다중 알림 전송 완료: 성공: {}, 실패: {}", 
                    response.getSuccessCount(), response.getFailureCount());
            
        } catch (FirebaseMessagingException e) {
            log.error("FCM 다중 알림 전송 실패", e);
        }
    }
} 