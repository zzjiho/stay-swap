package com.stayswap.notification.service;

import com.stayswap.notification.constant.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 푸시 알림 서비스
 * FCM 서비스를 이용한 푸시 알림 전송 처리를 담당
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PushNotificationService {

    private final FCMService fcmService;

    /**
     * 특정 사용자의 모든 디바이스로 푸시 알림 전송
     */
    public void sendPushNotificationToUser(Long userId, String title, String body,
                                           NotificationType type, Long referenceId) {
        fcmService.sendPushNotificationToUser(userId, title, body, type, referenceId);
    }

    /**
     * 특정 토큰으로 알림 전송 (테스트용)
     */
    public boolean sendPushNotificationToToken(String token, String title, String body) {
        return fcmService.sendPushNotificationToToken(token, title, body);
    }
} 