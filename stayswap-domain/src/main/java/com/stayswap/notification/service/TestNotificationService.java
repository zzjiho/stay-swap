package com.stayswap.notification.service;

import com.stayswap.notification.constant.NotificationType;
import com.stayswap.notification.dto.request.NotificationMessage;
import com.stayswap.notification.producer.NotificationPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 테스트 알림 서비스
 * 테스트 목적의 알림 기능을 담당
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TestNotificationService {

    private final NotificationPublisher notificationPublisher;

    /**
     * 테스트 알림 생성 (사용자 자신에게 발송)
     */
    public void createTestNotification(Long userId, String title, String content) {

        NotificationMessage message = NotificationMessage.builder()
                .recipientId(userId)
                .senderId(userId) // 자신에게 보내는 알림이므로 발신자도 동일
                .type(NotificationType.TEST_NOTIFICATION)
                .title(title != null ? title : "테스트 알림입니다")
                .content(content != null ? content : "이것은 테스트 알림입니다.")
                .referenceId(0L) // 테스트 알림이므로 참조 ID는 0으로 설정
                .build();

        notificationPublisher.sendNotification(message);
        log.info("테스트 알림 생성 완료 - userId: {}", userId);
    }
}