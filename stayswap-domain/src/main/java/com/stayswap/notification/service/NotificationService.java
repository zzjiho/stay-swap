package com.stayswap.notification.service;

import com.stayswap.notification.model.document.NotificationDocument;
import com.stayswap.notification.model.dto.request.NotificationMessage;
import com.stayswap.notification.model.dto.response.NotificationResponse;
import com.stayswap.notification.repository.NotificationMongoRepository;
import com.stayswap.user.repository.UserRepository;
import com.stayswap.error.exception.AuthenticationException;
import com.stayswap.error.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.stream.function.StreamBridge;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.stayswap.code.ErrorCode.*;


/**
 * 코어 알림 서비스
 * 알림 전송, 저장, 조회 등의 기본 기능을 담당
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

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
        NotificationDocument notification = saveNotificationToMongo(message);
        
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
    private NotificationDocument saveNotificationToMongo(NotificationMessage message) {
        userRepository.findById(message.getSenderId())
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));
        
        NotificationDocument notification = NotificationDocument.of(
                message.getRecipientId(),
                message.getSenderId(),
                message.getType(),
                message.getTitle(),
                message.getContent(),
                message.getReferenceId()
        );
        
        return notificationMongoRepository.save(notification);
    }

    /**
     * 사용자의 알림 목록 조회
     */
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(Long userId, Pageable pageable) {
        // MongoDB에서 알림 조회
        return notificationMongoRepository.findByRecipientIdOrderByCreatedAtDesc(userId, pageable)
                .map(NotificationResponse::fromDocument);
    }

    /**
     * 알림 읽음 처리
     */
    public NotificationResponse markAsRead(String notificationId, Long userId) {
        NotificationDocument notification = notificationMongoRepository.findById(notificationId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_RESOURCE));
        
        if (!notification.getRecipientId().equals(userId)) {
            throw new AuthenticationException(NOT_AUTHORIZED);
        }
        
        notification.markAsRead();
        notificationMongoRepository.save(notification);
        
        return NotificationResponse.fromDocument(notification);
    }

    /**
     * 읽지 않은 알림 개수 조회
     */
    @Transactional(readOnly = true)
    public long countUnreadNotifications(Long userId) {
        return notificationMongoRepository.countByRecipientIdAndIsRead(userId, false);
    }
} 