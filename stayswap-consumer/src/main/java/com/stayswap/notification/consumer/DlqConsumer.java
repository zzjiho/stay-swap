package com.stayswap.notification.consumer;

import com.stayswap.error.exception.NotFoundException;
import com.stayswap.notification.document.FailedNotification;
import com.stayswap.notification.document.Notification;
import com.stayswap.notification.dto.request.NotificationMessage;
import com.stayswap.notification.repository.FailedNotificationRepository;
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
public class DlqConsumer {

    private final UserRepository userRepository;
    private final NotificationMongoRepository notificationMongoRepository;
    private final FailedNotificationRepository failedNotificationRepository;

    /**
     * Kafka 스트림으로부터 알림 메시지 처리
     */
    @Bean("notification.dlq")
    public Consumer<NotificationMessage> notification() {
        return message -> {
            log.info("DLQ 알림 메시지 수신: {}", message);
            processNotification(message);
        };
    }

    /**
     * 실패한 알림 메시지를 MongoDB의 failed_notifications 컬렉션에 저장
     */
    public void processNotification(NotificationMessage message) {
        try {
            log.info("DLQ 메시지 처리 시작: {}", message);
            
            userRepository.findById(message.getSenderId())
                    .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));
            
            // 실패한 알림 메시지를 FailedNotification 컬렉션에 저장
            saveFailedNotification(message, "notification", "원본 메시지 처리 실패", null);
            
            log.info("DLQ 메시지 처리 완료: {}", message);
        } catch (Exception e) {
            log.error("DLQ 메시지 처리 중 오류 발생: {}", message, e);
            
            // DLQ 처리 중에도 오류가 발생한 경우, 스택 트레이스를 포함하여 저장
            String stackTrace = getStackTraceAsString(e);
            saveFailedNotification(message, "notification", e.getMessage(), stackTrace);
        }
    }

    /**
     * 실패한 알림을 FailedNotification 컬렉션에 저장
     */
    private FailedNotification saveFailedNotification(NotificationMessage message, 
                                                     String originalTopic, 
                                                     String exceptionMessage, 
                                                     String stackTrace) {
        FailedNotification failedNotification = FailedNotification.of(
                originalTopic, 
                exceptionMessage, 
                stackTrace, 
                message
        );
        
        return failedNotificationRepository.save(failedNotification);
    }
    
    /**
     * 예외의 스택 트레이스를 문자열로 변환
     */
    private String getStackTraceAsString(Exception e) {
        StringBuilder sb = new StringBuilder();
        for (StackTraceElement element : e.getStackTrace()) {
            sb.append(element.toString()).append("\n");
        }
        return sb.toString();
    }
}