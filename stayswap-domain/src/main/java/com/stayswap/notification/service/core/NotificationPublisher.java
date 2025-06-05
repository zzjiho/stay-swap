package com.stayswap.notification.service.core;

import com.stayswap.error.exception.NotFoundException;
import com.stayswap.notification.model.document.Notification;
import com.stayswap.notification.model.dto.request.NotificationMessage;
import com.stayswap.notification.repository.NotificationMongoRepository;
import com.stayswap.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.stream.function.StreamBridge;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.stayswap.code.ErrorCode.NOT_EXISTS_USER;


/**
 * 코어 알림 서비스
 * 알림 전송, 저장, 조회 등의 기본 기능을 담당
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class NotificationPublisher {

    private final NotificationMongoRepository notificationMongoRepository;
    private final UserRepository userRepository;
    private final StreamBridge streamBridge;
    private final PushNotificationService pushNotificationService;

    /**
     * 알림 메시지를 Kafka로 전송
     */
    public void sendNotification(NotificationMessage message) {
        streamBridge.send("notification-out-0", message);
        log.info("알림 메시지 전송 완료: {}", message);
    }

    /**
     * 알림 저장 및 FCM 발송 처리 (Kafka 컨슈머에서 호출)
     */
    public void processNotification(NotificationMessage message) {
        userRepository.findById(message.getSenderId())
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));
        
        Notification notification = saveNotificationToMongo(message);
        
        // 푸시 알림 전송 (사용자의 모든 기기에)
        pushNotificationService.sendPushNotificationToUser(
                notification.getRecipientId(),
                notification.getTitle(),
                notification.getContent(),
                notification.getType(),
                notification.getReferenceId()
        );
    }

    /**
     * 알림 MongoDB에 저장
     */
    private Notification saveNotificationToMongo(NotificationMessage message) {
        Notification notification = Notification.of(message);
        return notificationMongoRepository.save(notification);
    }
}