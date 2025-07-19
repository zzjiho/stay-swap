package com.stayswap.scheduler.chat;

import com.stayswap.chat.document.FailedChatMessage;
import com.stayswap.chat.dto.ChatMessageEvent;
import com.stayswap.chat.repository.FailedChatMessageRepository;
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
public class FailedChatMessageJob {

    private final FailedChatMessageRepository failedChatMessageRepository;
    private final StreamBridge streamBridge;
    
    private static final int MAX_RETRY_COUNT = 3;
    private static final int BATCH_SIZE = 100;
    
    // 토픽 이름과 바인딩 이름 매핑
    private static final Map<String, String> CHAT_TOPIC_TO_BINDING = Map.of(
            "chatMessage", "chatMessage-out-0"
    );
    
    /**
     * 실패한 채팅 메시지 재처리 스케줄러
     */
    public void run() {
        log.info("실패한 채팅 메시지 재처리 스케줄러 시작");
        
        List<FailedChatMessage> failedMessages = failedChatMessageRepository
                .findByRetriedFalseAndRetryCountLessThan(MAX_RETRY_COUNT, BATCH_SIZE);
        
        if (failedMessages.isEmpty()) {
            log.info("재처리할 실패 채팅 메시지가 없습니다.");
            return;
        }
        
        log.info("실패 채팅 메시지 {}개 재처리 시작", failedMessages.size());
        
        Map<FailedChatMessage.FailureType, Integer> typeCounts = new HashMap<>();
        
        // 각 실패 메시지를 원본 토픽으로 재전송
        for (FailedChatMessage failedMessage : failedMessages) {
            try {
                // 실패 유형 카운트 증가
                typeCounts.merge(failedMessage.getFailureType(), 1, Integer::sum);
                
                if (failedMessage.getFailureType() == FailedChatMessage.FailureType.USER_NOT_FOUND) {
                    log.info("사용자를 찾을 수 없는 실패 채팅 메시지는 재시도하지 않음: {}", failedMessage.getId());
                    
                    // 재시도 처리된 것으로 표시하여 다음 스케줄에서 다시 시도하지 않도록 함
                    failedMessage.markAsRetried();
                    failedChatMessageRepository.save(failedMessage);
                    continue;
                }
                
                if (failedMessage.getFailureType() == FailedChatMessage.FailureType.VALIDATION_ERROR) {
                    log.info("데이터 검증 오류는 재시도하지 않음: {}", failedMessage.getId());
                    
                    failedMessage.markAsRetried();
                    failedChatMessageRepository.save(failedMessage);
                    continue;
                }
                
                // 원본 메시지와 토픽 가져오기
                ChatMessageEvent originalMessage = failedMessage.getOriginalMessage();
                String originalTopic = failedMessage.getOriginalTopic();
                
                // 토픽에 해당하는 바인딩 이름 찾기
                String bindingName = CHAT_TOPIC_TO_BINDING.getOrDefault(originalTopic, originalTopic + "-out-0");
                
                log.info("채팅 메시지 재전송 시도: {} -> 토픽: {}, 바인딩: {}", 
                        failedMessage.getId(), originalTopic, bindingName);
                
                // 원본 토픽으로 메시지 재전송
                boolean sent = streamBridge.send(bindingName, 
                        MessageBuilder.withPayload(originalMessage).build());
                
                if (sent) {
                    log.info("채팅 메시지 재전송 성공: {} -> {}", failedMessage.getId(), bindingName);
                    
                    // 재시도 성공 시 재시도 정보 업데이트
                    failedMessage.markAsRetried();
                    failedChatMessageRepository.save(failedMessage);
                } else {
                    log.error("채팅 메시지 재전송 실패: {}", failedMessage.getId());
                    
                    // 재시도 횟수만 증가
                    failedMessage.incrementRetryCount();
                    failedChatMessageRepository.save(failedMessage);
                }
            } catch (Exception e) {
                log.error("채팅 메시지 재전송 중 오류 발생: {}", failedMessage.getId(), e);
                
                // 재시도 횟수만 증가
                failedMessage.incrementRetryCount();
                failedChatMessageRepository.save(failedMessage);
            }
        }
        
        log.info("실패 채팅 메시지 재처리 결과 - 유형별 카운트: {}", typeCounts);
        log.info("실패 채팅 메시지 재처리 완료");
    }
    
    /**
     * 오래된 처리 완료된 실패 채팅 메시지 정리 (30일 이상된 메시지)
     * 매일 자정에 실행
     */
    @Scheduled(cron = "0 0 0 * * ?")
    public void cleanupOldFailedChatMessages() {
        log.info("오래된 실패 채팅 메시지 정리 시작");
        
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        long deletedCount = failedChatMessageRepository.deleteByRetriedTrueAndCreatedAtBefore(thirtyDaysAgo);
        
        log.info("오래된 실패 채팅 메시지 {}개 삭제 완료", deletedCount);
    }
} 