package com.stayswap.scheduler.notification;

import com.stayswap.notification.document.FailedNotification;
import com.stayswap.notification.document.FailedNotification.FailureType;
import com.stayswap.notification.dto.request.NotificationMessage;
import com.stayswap.notification.repository.FailedNotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.stream.function.StreamBridge;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
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
    
    private static final int MAX_RETRY_COUNT = 3;
    private static final int BATCH_SIZE = 100;
    
    // 토픽 이름과 바인딩 이름 매핑
    private static final Map<String, String> TOPIC_TO_BINDING = Map.of(
            "notification", "notification-out-0",
            "likeNotification", "likeNotification-out-0"
    );
    
    /**
     * 실패한 알림 메시지 재처리 스케줄러
     */
    public void run() {
        log.info("실패한 알림 메시지 재처리 스케줄러 시작");
        
        List<FailedNotification> failedNotifications = failedNotificationRepository
                .findByRetriedFalseAndRetryCountLessThan(MAX_RETRY_COUNT, BATCH_SIZE);
        
        if (failedNotifications.isEmpty()) {
            log.info("재처리할 실패 메시지가 없습니다.");
            return;
        }
        
        log.info("실패 메시지 {}개 재처리 시작", failedNotifications.size());
        
        Map<FailureType, Integer> typeCounts = new HashMap<>();
        
        // 각 실패 메시지를 원본 토픽으로 재전송
        for (FailedNotification failedNotification : failedNotifications) {
            try {
                // 실패 유형 카운트 증가
                typeCounts.merge(failedNotification.getFailureType(), 1, Integer::sum);
                
                // USER_NOT_FOUND 유형은 재시도하지 않음
                if (failedNotification.getFailureType() == FailureType.USER_NOT_FOUND) {
                    log.info("사용자를 찾을 수 없는 실패 메시지는 재시도하지 않음: {}", failedNotification.getId());
                    
                    // 재시도 처리된 것으로 표시하여 다음 스케줄에서 다시 시도하지 않도록 함
                    failedNotification.markAsRetried();
                    failedNotificationRepository.save(failedNotification);
                    continue;
                }
                
                // 원본 메시지와 토픽 가져오기
                NotificationMessage originalMessage = failedNotification.getOriginalMessage();
                String originalTopic = failedNotification.getOriginalTopic();
                
                // 토픽에 해당하는 바인딩 이름 찾기
                String bindingName = TOPIC_TO_BINDING.getOrDefault(originalTopic, originalTopic + "-out-0");
                
                log.info("메시지 재전송 시도: {} -> 토픽: {}, 바인딩: {}", 
                        failedNotification.getId(), originalTopic, bindingName);
                
                // 원본 토픽으로 메시지 재전송 (바인딩 이름 사용)
                boolean sent = streamBridge.send(bindingName, 
                        MessageBuilder.withPayload(originalMessage).build());
                
                if (sent) {
                    log.info("메시지 재전송 성공: {} -> {}", failedNotification.getId(), bindingName);
                    
                    // 재시도 성공 시 재시도 정보 업데이트
                    failedNotification.markAsRetried();
                    failedNotificationRepository.save(failedNotification);
                } else {
                    log.error("메시지 재전송 실패: {}", failedNotification.getId());
                    
                    // 재시도 횟수만 증가
                    failedNotification.incrementRetryCount();
                    failedNotificationRepository.save(failedNotification);
                }
            } catch (Exception e) {
                log.error("메시지 재전송 중 오류 발생: {}", failedNotification.getId(), e);
                
                // 재시도 횟수만 증가
                failedNotification.incrementRetryCount();
                failedNotificationRepository.save(failedNotification);
            }
        }
        
        // 실패 유형별 통계 로깅
        log.info("실패 메시지 재처리 결과 - 유형별 카운트: {}", typeCounts);
        log.info("실패 메시지 재처리 완료");
    }
    
    /**
     * 오래된 처리 완료된 실패 메시지 정리 (30일 이상된 메시지)
     * 매일 자정에 실행
     */
    @Scheduled(cron = "0 0 0 * * ?")
    public void cleanupOldFailedNotifications() {
        log.info("오래된 실패 메시지 정리 시작");
        
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        long deletedCount = failedNotificationRepository.deleteByRetriedTrueAndCreatedAtBefore(thirtyDaysAgo);
        
        log.info("오래된 실패 메시지 {}개 삭제 완료", deletedCount);
    }
} 