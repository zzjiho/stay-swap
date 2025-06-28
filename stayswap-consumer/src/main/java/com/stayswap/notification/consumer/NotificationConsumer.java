package com.stayswap.notification.consumer;

import com.stayswap.error.exception.NotFoundException;
import com.stayswap.notification.consumer.core.PushNotificationService;
import com.stayswap.notification.document.Notification;
import com.stayswap.notification.dto.request.NotificationMessage;
import com.stayswap.notification.repository.NotificationMongoRepository;
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
            log.info("알림 메시지 수신: {}", message);
            processNotification(message);
        };
    }

    /**
     * 알림 저장 및 FCM 발송 처리
     */
    public void processNotification(NotificationMessage message) {

        userRepository.findById(message.getSenderId())
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));

        var recipient = userRepository.findById(message.getRecipientId())
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));

        // 알림은 항상 저장
        Notification notification = saveNotificationToMongo(message);

        // 푸시 알림 허용한 사용자에게만 FCM 전송
        if (recipient.getPushNotificationYN()) {
            pushNotificationService.sendPushNotificationToUser(
                    notification.getRecipientId(),
                    notification.getTitle(),
                    notification.getContent(),
                    notification.getType(),
                    notification.getReferenceId()
            );
        } else {
            log.info("푸시 알림 거부된 사용자: recipientId={}", notification.getRecipientId());
        }
    }

    //  실제 운영에서는 spring cloud stream이 자동으로 감지하는데 테스트는 그렇게 안되서 예외 터트림
//    public void processNotification(NotificationMessage message) {
//        // ===== 테스트를 위한 의도적 에러 발생 코드 =====
//        // 테스트 1: MongoDB 저장 실패 시뮬레이션
//        if (message.getContent() != null && message.getContent().equals("FORCE_MONGO_ERROR")) {
//            log.error("테스트: MongoDB 저장 실패 시뮬레이션");
//            throw new RuntimeException("MongoDB 저장 중 에러 발생 (테스트)");
//        }
//
//        // 테스트 2: FCM 실패 시뮬레이션
//        if (message.getContent() != null && message.getContent().equals("FORCE_FCM_ERROR")) {
//            log.error("테스트: FCM 전송 전에 의도적 실패");
//            // 일단 사용자는 확인하고 MongoDB에는 저장
//            userRepository.findById(message.getSenderId())
//                    .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));
//
//            // FCM 전송 부분에서 실패
//            throw new RuntimeException("FCM 푸시 알림 전송 실패 (테스트)");
//        }
//        // ===============================================
//        Notification notification = saveNotificationToMongo(message);
//
//        pushNotificationService.sendPushNotificationToUser(
//                notification.getRecipientId(),
//                notification.getTitle(),
//                notification.getContent(),
//                notification.getType(),
//                notification.getReferenceId()
//        );
//
//
//    }

    /**
     * 알림 MongoDB에 저장
     */
    private Notification saveNotificationToMongo(NotificationMessage message) {
        Notification notification = Notification.of(message);
        return notificationMongoRepository.save(notification);
    }

}