package com.stayswap.notification.document;

import com.stayswap.notification.dto.request.NotificationMessage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.TypeAlias;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TypeAlias("FailedNotification")
@Document(collection = "failed_notifications")
public class FailedNotification {

    /**
     * 실패 유형 정의
     */
    public enum FailureType {
        CONSUME_FAIL,       // 일반적인 소비 실패
        USER_NOT_FOUND,     // 사용자 조회 실패
        FCM_ERROR,          // FCM 푸시 알림 실패
        UNKNOWN             // 알 수 없는 오류
    }

    @Id
    private String id;
    
    private String originalTopic;
    private String exceptionMessage;
    private String stackTrace;
    private NotificationMessage originalMessage;
    
    private FailureType failureType;  // 실패 유형
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    private boolean retried;
    private LocalDateTime retriedAt;
    private int retryCount;  // 재시도 횟수
    
    public static FailedNotification of(String originalTopic, String exceptionMessage, 
                                        String stackTrace, NotificationMessage message) {
        return of(originalTopic, exceptionMessage, stackTrace, message, determineFailureType(exceptionMessage));
    }
    
    public static FailedNotification of(String originalTopic, String exceptionMessage, 
                                        String stackTrace, NotificationMessage message,
                                        FailureType failureType) {
        return FailedNotification.builder()
                .originalTopic(originalTopic)
                .exceptionMessage(exceptionMessage)
                .stackTrace(stackTrace)
                .originalMessage(message)
                .failureType(failureType)
                .retried(false)
                .retryCount(0)
                .createdAt(LocalDateTime.now())
                .build();
    }
    
    /**
     * 예외 메시지를 기반으로 실패 유형 결정
     */
    private static FailureType determineFailureType(String exceptionMessage) {
        if (exceptionMessage == null) {
            return FailureType.UNKNOWN;
        }
        
        String message = exceptionMessage.toLowerCase();
        
        if (message.contains("user") && (message.contains("not found") || message.contains("not exist"))) {
            return FailureType.USER_NOT_FOUND;
        } else if (message.contains("fcm") || message.contains("firebase") || message.contains("push")) {
            return FailureType.FCM_ERROR;
        }

        return FailureType.CONSUME_FAIL;
    }
    
    public void markAsRetried() {
        this.retried = true;
        this.retryCount++;
        this.retriedAt = LocalDateTime.now();
    }
    
    public void incrementRetryCount() {
        this.retryCount++;
    }
} 