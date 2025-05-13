package com.stayswap.domains.notification.service;

import com.google.firebase.messaging.*;
import com.stayswap.domains.notification.constant.NotificationType;
import com.stayswap.domains.user.service.UserDeviceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Slf4j
@Service
@RequiredArgsConstructor
public class FCMService {

    private final FirebaseMessaging firebaseMessaging;
    private final UserDeviceService userDeviceService;

    /**
     * 특정 사용자의 모든 디바이스로 푸시 알림 전송
     */
    public void sendPushNotificationToUser(Long userId, String title, String body, 
                                          NotificationType type, Long referenceId) {
        
        // 사용자의 모든 활성 디바이스 FCM 토큰 조회
        List<String> tokens = userDeviceService.getActiveFcmTokensByUserId(userId);
        
        if (tokens.isEmpty()) {
            log.warn("푸시 알림 전송 실패: 사용자 디바이스가 없습니다. userId={}", userId);
            return;
        }
        
        // 알림 데이터 구성
        Map<String, String> data = new HashMap<>();
        data.put("type", type.name());
        data.put("referenceId", String.valueOf(referenceId));
        
        // 다중 디바이스에 알림 전송
        MulticastMessage message = MulticastMessage.builder()
                .putAllData(data)
                .setNotification(Notification.builder()
                        .setTitle(title)
                        .setBody(body)
                        .build())
                .addAllTokens(tokens)
                .build();
        
        try {
            BatchResponse response = firebaseMessaging.sendEachForMulticast(message);
            
            // 실패한 토큰 처리
            for (int i = 0; i < response.getResponses().size(); i++) {
                if (!response.getResponses().get(i).isSuccessful()) {
                    SendResponse sendResponse = response.getResponses().get(i);
                    
                    if (sendResponse.getException() != null &&
                            (sendResponse.getException().getMessagingErrorCode() == MessagingErrorCode.UNREGISTERED ||
                             sendResponse.getException().getMessagingErrorCode() == MessagingErrorCode.INVALID_ARGUMENT)) {
                        
                        // 더 이상 유효하지 않은 토큰 비활성화
                        String invalidToken = tokens.get(i);
                        userDeviceService.deactivateToken(invalidToken);
                        log.info("유효하지 않은 FCM 토큰 비활성화: {}", invalidToken);
                    }
                }
            }
            
            log.info("푸시 알림 전송 완료: userId={}, 성공={}, 실패={}", 
                    userId, response.getSuccessCount(), response.getFailureCount());
            
        } catch (FirebaseMessagingException e) {
            log.error("푸시 알림 전송 실패: {}", e.getMessage(), e);
        }
    }

    /**
     * 특정 토큰으로 알림 전송 (테스트용)
     */
    public boolean sendPushNotificationToToken(String token, String title, String body) {
        Message message = Message.builder()
                .setNotification(Notification.builder()
                        .setTitle(title)
                        .setBody(body)
                        .build())
                .setToken(token)
                .build();

        try {
            String response = firebaseMessaging.sendAsync(message).get();
            log.info("푸시 알림 전송 성공: messageId={}", response);
            return true;
        } catch (InterruptedException | ExecutionException e) {
            log.error("푸시 알림 전송 실패: {}", e.getMessage(), e);
            return false;
        }
    }
} 