package com.stayswap.chat.document;

import com.stayswap.chat.dto.ChatMessageEvent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "failed_chat_messages")
public class FailedChatMessage {

    @Id
    private String id;

    private String originalTopic;
    private String exceptionMessage;
    private String stackTrace;
    private ChatMessageEvent originalMessage;
    private FailureType failureType;
    private int retryCount;
    private boolean retried;
    private LocalDateTime createdAt;
    private LocalDateTime lastRetryAt;

    public enum FailureType {
        TEMPORARY_ERROR,      // 일시적 오류 (재시도 대상)
        PERMANENT_ERROR,      // 영구적 오류 (재시도 제외)
        VALIDATION_ERROR,     // 데이터 검증 오류 (재시도 제외)
        USER_NOT_FOUND,       // 사용자 없음 (재시도 제외)
        EXTERNAL_SERVICE_ERROR // 외부 서비스 오류 (재시도 대상)
    }

    public static FailedChatMessage of(String originalTopic, String exceptionMessage, 
                                      String stackTrace, ChatMessageEvent originalMessage) {
        return FailedChatMessage.builder()
                .originalTopic(originalTopic)
                .exceptionMessage(exceptionMessage)
                .stackTrace(stackTrace)
                .originalMessage(originalMessage)
                .failureType(determineFailureType(exceptionMessage))
                .retryCount(0)
                .retried(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    private static FailureType determineFailureType(String exceptionMessage) {
        if (exceptionMessage != null) {
            if (exceptionMessage.contains("NOT_EXISTS_USER")) {
                return FailureType.USER_NOT_FOUND;
            } else if (exceptionMessage.contains("Validation") || exceptionMessage.contains("Constraint")) {
                return FailureType.VALIDATION_ERROR;
            } else if (exceptionMessage.contains("Connection") || exceptionMessage.contains("Timeout")) {
                return FailureType.TEMPORARY_ERROR;
            } else if (exceptionMessage.contains("FCM") || exceptionMessage.contains("Firebase")) {
                return FailureType.EXTERNAL_SERVICE_ERROR;
            }
        }
        return FailureType.PERMANENT_ERROR;
    }

    public void markAsRetried() {
        this.retried = true;
        this.lastRetryAt = LocalDateTime.now();
    }

    public void incrementRetryCount() {
        this.retryCount++;
        this.lastRetryAt = LocalDateTime.now();
    }
} 