package com.stayswap.notification.consumer;

import com.stayswap.error.exception.NotFoundException;
import com.stayswap.notification.model.document.Notification;
import com.stayswap.notification.model.dto.request.NotificationMessage;
import com.stayswap.notification.repository.NotificationMongoRepository;
import com.stayswap.notification.service.core.PushNotificationService;
import com.stayswap.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

import java.util.function.Consumer;

import static com.stayswap.code.ErrorCode.NOT_EXISTS_USER;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationConsumer {

    private final UserRepository userRepository;
    private final PushNotificationService pushNotificationService;
    private final NotificationMongoRepository notificationMongoRepository;

    /**
     * Kafka 스트림으로부터 알림 메시지 처리
     */
    @Bean("notification")
    public Consumer<NotificationMessage> notification() {
        return message -> {
            try {
                log.info("알림 메시지 수신: {}", message);
                processNotification(message);
            } catch (Exception e) {
                // todo: handle exception
                log.error("알림 처리 중 오류 발생", e);
            }
        };
    }

    /**
     * 알림 저장 및 FCM 발송 처리
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