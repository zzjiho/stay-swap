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

import java.nio.charset.StandardCharsets;
import java.util.function.Consumer;

@Slf4j
@Component
@RequiredArgsConstructor
public class DlqConsumer {

    private final FailedNotificationRepository failedNotificationRepository;
    private final KafkaTemplate<String, NotificationMessage> kafkaTemplate;
    
    // 알림 타입별 기본 토픽 매핑
    private static final String DEFAULT_NOTIFICATION_TOPIC = "notification";
    private static final String DEFAULT_LIKE_NOTIFICATION_TOPIC = "likeNotification";

    /* ---------- 공통 헤더 파싱 유틸 ---------- */

    /** ORIGINAL_TOPIC → DLT_ORIGINAL_TOPIC 순서로 찾아서 없으면 "unknown" */
    private String resolveOriginalTopic(Message<?> message) {
        // 모든 헤더 키와 값 상세 출력
        log.debug("모든 헤더 확인:");
        message.getHeaders().forEach((key, value) -> {
            if (value instanceof byte[]) {
                log.debug("헤더 키: {}, 값(byte[]): {}", key, 
                        new String((byte[]) value, StandardCharsets.UTF_8));
            } else {
                log.debug("헤더 키: {}, 값: {}, 타입: {}", key, value, 
                        value != null ? value.getClass().getName() : "null");
            }
        });

        byte[] topicBytes = message.getHeaders()
                .get(KafkaHeaders.ORIGINAL_TOPIC, byte[].class);
        if (topicBytes == null) {
            topicBytes = message.getHeaders()
                    .get(KafkaHeaders.DLT_ORIGINAL_TOPIC, byte[].class);
        }
        
        // Spring Cloud Stream 3.x에서는 다른 헤더 이름을 사용할 수도 있음
        if (topicBytes == null) {
            topicBytes = message.getHeaders()
                    .get("kafka_dlt-original-topic", byte[].class);
        }
        
        if (topicBytes == null) {
            topicBytes = message.getHeaders()
                    .get("kafka_originalTopic", byte[].class);
        }
        
        // 추가 헤더 키 검사
        if (topicBytes == null) {
            topicBytes = message.getHeaders()
                    .get("scst_originalTopic", byte[].class);
        }
        
        if (topicBytes == null) {
            topicBytes = message.getHeaders()
                    .get("x-original-topic", byte[].class);
        }
        
        if (topicBytes == null) {
            topicBytes = message.getHeaders()
                    .get("x-exception-fqcn", byte[].class);
        }
        
        // Spring Cloud Stream 3.2+ 헤더 이름
        if (topicBytes == null) {
            topicBytes = message.getHeaders()
                    .get("deliveryAttempt", byte[].class);
        }
        
        if (topicBytes == null) {
            topicBytes = message.getHeaders()
                    .get("kafka_receivedTopic", byte[].class);
        }
        
        if (topicBytes == null) {
            // Kafka 메시지 수신 토픽을 확인해봄
            Object receivedTopic = message.getHeaders().get("kafka_receivedTopic");
            if (receivedTopic != null) {
                String topic = receivedTopic.toString();
                // DLT 접두사가 붙은 토픽에서 원본 토픽 추출 시도
                if (topic.startsWith("error.") || topic.contains(".dlq") || topic.contains("-dlq")) {
                    // 접두사 제거하여 원본 토픽 추정
                    topic = topic.replace("error.", "")
                                 .replace(".dlq", "")
                                 .replace("-dlq", "");
                    return topic; // 원본 토픽으로 추정되는 값 반환
                }
            }
        }
        
        String topic = topicBytes != null
                ? new String(topicBytes, StandardCharsets.UTF_8)
                : "unknown";
                
        // 디버그용 로그 추가 - 모든 헤더 키 출력
        log.debug("원본 토픽 확인 - 헤더에서 찾은 값: {}", topic);
                
        return topic;
    }
    
    /**
     * 메시지 타입에 따라 적절한 토픽을 반환
     * 원본 토픽을 찾을 수 없는 경우 메시지 타입에 따라 기본 토픽 사용
     */
    private String determineTopicFromMessage(String originalTopic, NotificationMessage message) {
        if (!"unknown".equals(originalTopic)) {
            return originalTopic;
        }
        
        // 메시지 타입에 따라 적절한 토픽 결정
        if (message.getType() != null) {
            switch (message.getType()) {
                case LIKE_ADDED:
                case LIKE_REMOVED:
                    return DEFAULT_LIKE_NOTIFICATION_TOPIC;
                default:
                    return DEFAULT_NOTIFICATION_TOPIC;
            }
        }
        
        return DEFAULT_NOTIFICATION_TOPIC;
    }

    /** 예외 메시지는 String 또는 byte[] 모두 대응 */
    private String resolveException(Message<?> message) {
        String ex = message.getHeaders()
                .get(KafkaHeaders.DLT_EXCEPTION_MESSAGE, String.class);
        if (ex == null) {
            byte[] exBytes = message.getHeaders()
                    .get("x-exception-message", byte[].class);
            ex = exBytes != null ? new String(exBytes, StandardCharsets.UTF_8) : "";
        }
        return ex;
    }

    /** 스택트레이스는 byte[]로만 들어옴 */
    private String resolveStackTrace(Message<?> message) {
        byte[] stack = message.getHeaders()
                .get(KafkaHeaders.DLT_EXCEPTION_STACKTRACE, byte[].class);
        return stack != null ? new String(stack, StandardCharsets.UTF_8) : "";
    }

    /* ---------- 일반 알림 DLQ ---------- */

    @Bean("notificationDlq")
    public Consumer<Message<NotificationMessage>> notificationDlq() {
        return message -> {

            log.debug("DLQ 수신 - 모든 헤더: {}", message.getHeaders());

            NotificationMessage payload = message.getPayload();

            String originalTopic = resolveOriginalTopic(message);
            String exception     = resolveException(message);
            String stackTrace    = resolveStackTrace(message);

            log.error("DLQ 수신 - 원본: {}, 예외: {}, payload: {}",
                    originalTopic, exception, payload);
                    
            // 원본 토픽을 찾을 수 없는 경우 메시지 타입에 따라 결정
            if ("unknown".equals(originalTopic)) {
                originalTopic = determineTopicFromMessage(originalTopic, payload);
                log.info("원본 토픽을 찾을 수 없어 메시지 타입에 따라 토픽 결정: {}", originalTopic);
            }

            FailedNotification failed = FailedNotification.of(
                    originalTopic, exception, stackTrace, payload);
            failedNotificationRepository.save(failed);

            log.info("Mongo 저장 완료 - 유형: {}, id: {}, 원본 토픽: {}",
                    failed.getFailureType(), failed.getId(), originalTopic);
        };
    }

    /* ---------- 좋아요 알림 DLQ ---------- */

    @Bean("likeNotificationDlq")
    public Consumer<Message<NotificationMessage>> likeNotificationDlq() {
        return message -> {

            log.debug("좋아요 DLQ 수신 - 모든 헤더: {}", message.getHeaders());

            NotificationMessage payload = message.getPayload();

            String originalTopic = resolveOriginalTopic(message);
            String exception     = resolveException(message);
            String stackTrace    = resolveStackTrace(message);

            log.error("좋아요 DLQ 수신 - 원본: {}, 예외: {}, payload: {}",
                    originalTopic, exception, payload);
                    
            // 원본 토픽을 찾을 수 없는 경우 메시지 타입에 따라 결정
            if ("unknown".equals(originalTopic)) {
                originalTopic = determineTopicFromMessage(originalTopic, payload);
                log.info("원본 토픽을 찾을 수 없어 메시지 타입에 따라 토픽 결정: {}", originalTopic);
            }

            FailedNotification failed = FailedNotification.of(
                    originalTopic, exception, stackTrace, payload);
            failedNotificationRepository.save(failed);

            log.info("좋아요 실패 Mongo 저장 완료 - 유형: {}, id: {}, 원본 토픽: {}",
                    failed.getFailureType(), failed.getId(), originalTopic);
        };
    }

    /* ---------- 외부에서 수동 재처리 호출용 ---------- */

    public void retryFailedMessage(FailedNotification failedNotification) {
        NotificationMessage msg = failedNotification.getOriginalMessage();
        String originalTopic    = failedNotification.getOriginalTopic();
        
        // 원본 토픽이 unknown이면 메시지 타입에 따라 토픽 결정
        if ("unknown".equals(originalTopic)) {
            originalTopic = determineTopicFromMessage(originalTopic, msg);
            log.info("재처리 시 원본 토픽이 unknown이어서 메시지 타입에 따라 토픽 결정: {}", originalTopic);
        }

        log.info("재처리 시도 - id={}, topic={}, payload={}",
                failedNotification.getId(), originalTopic, msg);

        kafkaTemplate.send(originalTopic, msg)
                .whenComplete((result, ex) -> {
                    if (ex == null) {                 // 성공
                        failedNotification.markAsRetried();
                        failedNotificationRepository.save(failedNotification);
                        log.info("재처리 성공 - id={}", failedNotification.getId());
                    } else {                          // 실패
                        log.error("재처리 실패 - id={}, error={}",
                                failedNotification.getId(), ex.getMessage(), ex);
                    }
                });
    }
}
