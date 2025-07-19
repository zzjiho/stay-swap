package com.stayswap.chat.consumer;

import com.stayswap.chat.document.FailedChatMessage;
import com.stayswap.chat.dto.ChatMessageEvent;
import com.stayswap.chat.repository.FailedChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

import java.util.function.Consumer;

@Slf4j
@Component
@RequiredArgsConstructor
public class DlqChatConsumer {

    private final FailedChatMessageRepository failedChatMessageRepository;

    /**
     * Kafka 스트림으로부터 실패한 채팅 메시지 처리
     */
    @Bean("chatMessage.dlq")
    public Consumer<ChatMessageEvent> chatMessage() {
        return event -> {
            log.info("DLQ 채팅 메시지 수신: {}", event);
            processFailedChatMessage(event);
        };
    }

    public void processFailedChatMessage(ChatMessageEvent event) {
        try {
            log.info("DLQ 채팅 메시지 처리 시작: {}", event);

            // 실패한 채팅 메시지를 FailedChatMessage 컬렉션에 저장
            saveFailedChatMessage(event, "chatMessage", "원본 메시지 처리 실패", null);
            
            log.info("DLQ 채팅 메시지 처리 완료: {}", event);
        } catch (Exception e) {
            log.error("DLQ 채팅 메시지 처리 중 오류 발생: {}", event, e);
            String stackTrace = getStackTraceAsString(e);
            saveFailedChatMessage(event, "chatMessage", e.getMessage(), stackTrace);
        }
    }

    private FailedChatMessage saveFailedChatMessage(ChatMessageEvent event,
                                                   String originalTopic, 
                                                   String exceptionMessage, 
                                                   String stackTrace) {
        FailedChatMessage failedChatMessage = FailedChatMessage.of(
                originalTopic, 
                exceptionMessage, 
                stackTrace, 
                event
        );
        
        return failedChatMessageRepository.save(failedChatMessage);
    }

    private String getStackTraceAsString(Exception e) {
        StringBuilder sb = new StringBuilder();
        for (StackTraceElement element : e.getStackTrace()) {
            sb.append(element.toString()).append("\n");
        }
        return sb.toString();
    }
} 