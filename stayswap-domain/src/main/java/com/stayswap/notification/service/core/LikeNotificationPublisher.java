package com.stayswap.notification.service.core;

import com.stayswap.error.exception.NotFoundException;
import com.stayswap.notification.model.document.Notification;
import com.stayswap.notification.model.dto.request.LikeNotificationMessage;
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
 * 좋아요 알림 이벤트
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class LikeNotificationPublisher {

    private final NotificationMongoRepository notificationMongoRepository;
    private final UserRepository userRepository;
    private final StreamBridge streamBridge;

    /**
     * 알림 메시지를 Kafka로 전송
     */
    public void sendNotification(NotificationMessage message) {
        streamBridge.send("likeNotification-out-0", message);
        log.info("좋아요 알림 메시지 전송 완료: {}", message);
    }

    /**
     * 알림 저장 (Kafka 컨슈머에서 호출), FCM 푸시알림 전송 X
     */
    public void processLikeNotification(NotificationMessage message) {
        userRepository.findById(message.getSenderId())
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));
        
        saveNotificationToMongo(message);
    }

    /**
     * 알림 MongoDB에 저장
     */
    private Notification saveNotificationToMongo(NotificationMessage message) {
        Notification notification = Notification.of(message);
        return notificationMongoRepository.save(notification);
    }
}