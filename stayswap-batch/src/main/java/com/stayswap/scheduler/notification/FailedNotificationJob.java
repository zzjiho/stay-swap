package com.stayswap.scheduler.notification;

import com.stayswap.notification.document.FailedNotification;
import com.stayswap.notification.document.FailedNotification.FailureType;
import com.stayswap.notification.dto.request.NotificationMessage;
import com.stayswap.notification.repository.FailedNotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.stream.function.StreamBridge;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class FailedNotificationJob {

    private final FailedNotificationRepository failedNotificationRepository;
    private final StreamBridge streamBridge;

    // 실패 유형별 최대 재시도 횟수
    private static final Map<FailureType, Integer> MAX_RETRY_COUNT = new HashMap<>();
    
    // 알림 타입별 기본 토픽 매핑
    private static final String DEFAULT_NOTIFICATION_TOPIC = "notification";
    private static final String DEFAULT_LIKE_NOTIFICATION_TOPIC = "likeNotification";
    
    static {
        MAX_RETRY_COUNT.put(FailureType.CONSUME_FAIL, 5);      // 일반 소비 실패: 5회 재시도
        MAX_RETRY_COUNT.put(FailureType.FCM_ERROR, 3);         // FCM 에러: 3회 재시도
        MAX_RETRY_COUNT.put(FailureType.USER_NOT_FOUND, 1);    // 사용자 없음: 1회만 재시도
        MAX_RETRY_COUNT.put(FailureType.UNKNOWN, 3);           // 알 수 없는 오류: 3회 재시도
    }

    public void run() {
        log.info("실패한 알림 메시지 재처리 작업 시작");
        
        List<FailedNotification> unprocessedNotifications = failedNotificationRepository.findByRetried(false);
        log.info("재처리할 실패 메시지 수: {}", unprocessedNotifications.size());
        
        // 실패 유형별로 그룹화
        Map<FailureType, List<FailedNotification>> groupedByType = unprocessedNotifications.stream()
                .collect(Collectors.groupingBy(FailedNotification::getFailureType));
        
        int successCount = 0;
        int failCount = 0;
        int skipCount = 0;
        
        // 각 실패 유형별로 처리
        for (Map.Entry<FailureType, List<FailedNotification>> entry : groupedByType.entrySet()) {
            FailureType failureType = entry.getKey();
            List<FailedNotification> notifications = entry.getValue();
            
            log.info("실패 유형 {} 처리 중 - 메시지 수: {}", failureType, notifications.size());
            
            for (FailedNotification notification : notifications) {
                // 최대 재시도 횟수 확인
                int maxRetries = MAX_RETRY_COUNT.getOrDefault(failureType, 3);
                
                // 디버그 로깅 추가
                log.debug("재시도 검사 - ID: {}, 현재 재시도 횟수: {}, 최대 재시도 횟수: {}", 
                        notification.getId(), notification.getRetryCount(), maxRetries);
                
                // 테스트를 위해 일시적으로 재시도 횟수 체크 로직 우회
                /*
                // 이미 최대 재시도 횟수를 초과한 경우 스킵
                if (notification.getRetryCount() >= maxRetries) {
                    log.warn("최대 재시도 횟수({})를 초과하여 스킵 - ID: {}, 실패 유형: {}, 현재 재시도 횟수: {}", 
                            maxRetries, notification.getId(), failureType, notification.getRetryCount());
                    skipCount++;
                    continue;
                }
                */
                
                // 테스트를 위해 항상 재시도
                log.info("테스트를 위해 최대 재시도 횟수 체크를 우회하고 재시도합니다 - ID: {}, 현재 재시도 횟수: {}", 
                        notification.getId(), notification.getRetryCount());
                
                try {
                    retryFailedMessage(notification);
                    successCount++;
                } catch (Exception e) {
                    log.error("메시지 재처리 실패 - ID: {}, 실패 유형: {}, 오류: {}", 
                            notification.getId(), failureType, e.getMessage(), e);
                    failCount++;
                    
                    // 재시도 횟수 증가 (성공하지 않았지만 시도는 했으므로)
                    notification.incrementRetryCount();
                    failedNotificationRepository.save(notification);
                }
            }
        }
        
        log.info("실패한 알림 메시지 재처리 완료 - 성공: {}, 실패: {}, 스킵: {}", 
                successCount, failCount, skipCount);
    }
    
    /**
     * 메시지 타입에 따라 적절한 토픽을 결정
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
    
    /**
     * 개별 메시지 재처리 메서드
     */
    public void retryFailedMessage(FailedNotification failedNotification) {
        NotificationMessage message = failedNotification.getOriginalMessage();
        String originalTopic = failedNotification.getOriginalTopic();
        FailureType failureType = failedNotification.getFailureType();
        
        // 원본 토픽이 unknown인 경우 메시지 타입에 따라 토픽 결정
        if ("unknown".equals(originalTopic)) {
            originalTopic = determineTopicFromMessage(originalTopic, message);
            log.info("원본 토픽이 unknown이어서 메시지 타입에 따라 토픽 결정: {}", originalTopic);
        }
        
        log.info("메시지 재처리 시도 - ID: {}, 토픽: {}, 실패 유형: {}, 재시도 횟수: {}", 
                failedNotification.getId(), originalTopic, failureType, 
                failedNotification.getRetryCount() + 1);
        
        // StreamBridge를 사용하여 메시지 전송
        String outputBinding;
        if ("notification".equals(originalTopic)) {
            outputBinding = "notification-out-0";
        } else if ("likeNotification".equals(originalTopic)) {
            outputBinding = "likeNotification-out-0";
        } else {
            outputBinding = "notification-out-0"; // 기본값
            log.warn("알 수 없는 토픽 {}를 notification-out-0으로 매핑합니다", originalTopic);
        }
        
        boolean sent = streamBridge.send(outputBinding, 
                MessageBuilder.withPayload(message)
                        .setHeader("ORIGINAL_TOPIC", originalTopic)
                        .build());
        
        if (sent) {
            // 재처리 성공 시 상태 업데이트
            failedNotification.markAsRetried();
            failedNotificationRepository.save(failedNotification);
            log.info("메시지 재처리 성공 - ID: {}", failedNotification.getId());
        } else {
            log.error("메시지 재처리 실패 - 메시지를 전송하지 못했습니다 - ID: {}", failedNotification.getId());
            failedNotification.incrementRetryCount();
            failedNotificationRepository.save(failedNotification);
        }
    }
} 