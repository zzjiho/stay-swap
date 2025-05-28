package com.stayswap.notification.service;

import com.stayswap.config.RabbitMQConfig;
import com.stayswap.notification.model.dto.request.NotificationMessage;
import com.stayswap.notification.model.dto.response.NotificationResponse;
import com.stayswap.notification.model.entity.Notification;
import com.stayswap.notification.repository.NotificationRepository;
import com.stayswap.user.model.entity.User;
import com.stayswap.user.repository.UserRepository;
import com.stayswap.error.exception.AuthenticationException;
import com.stayswap.error.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
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

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final RabbitTemplate rabbitTemplate;
    private final FCMService fcmService;

    /**
     * 알림 메시지를 RabbitMQ로 전송
     */
    public void sendNotification(NotificationMessage message) {
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.NOTIFICATION_EXCHANGE,
                RabbitMQConfig.NOTIFICATION_ROUTING_KEY, message
        );
        log.info("알림 메시지 전송 완료: {}", message);
    }

    /**
     * 알림 저장 및 FCM 발송 처리 (RabbitMQ 컨슈머에서 호출)
     */
    public void processNotification(NotificationMessage message) {
        Notification notification = saveNotification(message);
        
        // FCM 푸시 알림 전송 (사용자의 모든 기기에)
        fcmService.sendPushNotificationToUser(
                notification.getRecipient().getId(),
                notification.getTitle(),
                notification.getContent(),
                notification.getType(),
                notification.getReferenceId()
        );
    }

    /**
     * 알림 저장
     */
    private Notification saveNotification(NotificationMessage message) {
        User recipient = userRepository.findById(message.getRecipientId())
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));
        
        User sender = userRepository.findById(message.getSenderId())
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));
        
        Notification notification = Notification.builder()
                .recipient(recipient)
                .sender(sender)
                .type(message.getType())
                .title(message.getTitle())
                .content(message.getContent())
                .referenceId(message.getReferenceId())
                .build();
        
        return notificationRepository.save(notification);
    }

    /**
     * 사용자의 알림 목록 조회
     */
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(Long userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));
        
        return notificationRepository.findByRecipientOrderByRegTimeDesc(user, pageable)
                .map(NotificationResponse::from);
    }

    /**
     * 알림 읽음 처리
     */
    public NotificationResponse markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_RESOURCE));
        
        if (!notification.getRecipient().getId().equals(userId)) {
            throw new AuthenticationException(NOT_AUTHORIZED);
        }
        
        notification.markAsRead();
        
        return NotificationResponse.from(notification);
    }

    /**
     * 읽지 않은 알림 개수 조회
     */
    @Transactional(readOnly = true)
    public long countUnreadNotifications(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));
        
        return notificationRepository.countByRecipientAndIsRead(user, false);
    }
} 