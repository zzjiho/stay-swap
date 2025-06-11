package com.stayswap.notification.consumer;

import com.stayswap.notification.document.FailedNotification;
import com.stayswap.notification.dto.request.NotificationMessage;
import com.stayswap.notification.repository.FailedNotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Component;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.function.Consumer;

@Slf4j
@Component
@RequiredArgsConstructor
public class DlqConsumer {

    private final FailedNotificationRepository failedNotificationRepository;
    private final KafkaTemplate<String, NotificationMessage> kafkaTemplate;
    
    /**
     * 일반 알림 DLQ 메시지 처리
     */
    @Bean("notificationDlq")
    public Consumer<Message<NotificationMessage>> notificationDlq() {
        return message -> {
            NotificationMessage payload = message.getPayload();
            String originalTopic = new String((byte[]) message.getHeaders().get(KafkaHeaders.DLT_ORIGINAL_TOPIC));
            String exception = message.getHeaders().get(KafkaHeaders.DLT_EXCEPTION_MESSAGE, String.class);
            Throwable throwable = message.getHeaders().get(KafkaHeaders.DLT_EXCEPTION_STACKTRACE, Throwable.class);
            
            String stackTrace = getStackTraceAsString(throwable);
            
            log.error("DLQ 메시지 수신 - 원본 토픽: {}, 예외: {}, 메시지: {}", 
                    originalTopic, exception, payload);
            
            // 실패 정보를 MongoDB에 저장
            FailedNotification failedNotification = FailedNotification.of(
                    originalTopic, exception, stackTrace, payload);
            failedNotificationRepository.save(failedNotification);
            
            log.info("실패 메시지 저장 완료 - 실패 유형: {}, ID: {}", 
                    failedNotification.getFailureType(), failedNotification.getId());
            
            // todo: 오류 알림 발송?? (slack)
        };
    }

    /**
     * 좋아요 알림 DLQ 메시지 처리
     */
    @Bean("likeNotificationDlq")
    public Consumer<Message<NotificationMessage>> likeNotificationDlq() {
        return message -> {
            NotificationMessage payload = message.getPayload();
            String originalTopic = new String((byte[]) message.getHeaders().get(KafkaHeaders.DLT_ORIGINAL_TOPIC));
            String exception = message.getHeaders().get(KafkaHeaders.DLT_EXCEPTION_MESSAGE, String.class);
            Throwable throwable = message.getHeaders().get(KafkaHeaders.DLT_EXCEPTION_STACKTRACE, Throwable.class);
            
            String stackTrace = getStackTraceAsString(throwable);
            
            log.error("좋아요 DLQ 메시지 수신 - 원본 토픽: {}, 예외: {}, 메시지: {}", 
                    originalTopic, exception, payload);
            
            // 실패 정보 MongoDB에 저장
            FailedNotification failedNotification = FailedNotification.of(
                    originalTopic, exception, stackTrace, payload);
            failedNotificationRepository.save(failedNotification);
            
            log.info("좋아요 실패 메시지 저장 완료 - 실패 유형: {}, ID: {}", 
                    failedNotification.getFailureType(), failedNotification.getId());
        };
    }
    
    /**
     * 메시지 재처리 메서드 (필요시 외부에서 호출)
     */
    public void retryFailedMessage(FailedNotification failedNotification) {
        NotificationMessage message = failedNotification.getOriginalMessage();
        String originalTopic = failedNotification.getOriginalTopic();
        
        log.info("DLQ 메시지 재처리 시도 - ID: {}, 토픽: {}, 메시지: {}", 
                failedNotification.getId(), originalTopic, message);
        
        try {
            // 원본 토픽으로 메시지 다시 발행
            kafkaTemplate.send(originalTopic, message);
            
            // 재처리 성공 시 상태 업데이트
            failedNotification.markAsRetried();
            failedNotificationRepository.save(failedNotification);
            
            log.info("DLQ 메시지 재처리 성공 - ID: {}", failedNotification.getId());
        } catch (Exception e) {
            log.error("DLQ 메시지 재처리 실패 - ID: {}, 오류: {}", 
                    failedNotification.getId(), e.getMessage(), e);
        }
    }
    
    private String getStackTraceAsString(Throwable throwable) {
        if (throwable == null) {
            return "";
        }
        
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        throwable.printStackTrace(pw);
        return sw.toString();
    }
}