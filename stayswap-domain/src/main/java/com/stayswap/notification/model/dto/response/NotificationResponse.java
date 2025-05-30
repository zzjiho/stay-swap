package com.stayswap.notification.model.dto.response;

import com.stayswap.notification.constant.NotificationType;
import com.stayswap.notification.model.document.Notification;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.time.ZoneId;

@Getter
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class NotificationResponse {
    private String id;
    private Long recipientId;
    private String recipientNickname;
    private Long senderId;
    private String senderNickname;
    private NotificationType type;
    private String title;
    private String content;
    private boolean isRead;
    private Long referenceId;
    
    // 이벤트 발생 시간
    private LocalDateTime occurredAt;
    // 알림 생성 시간
    private LocalDateTime createdAt;
    // 마지막 업데이트 시간 (읽음 처리 등)
    private LocalDateTime lastUpdatedAt;
    // 삭제 예정 시간 (null이면 삭제 예정 없음)
    private LocalDateTime deletedAt;
    
    // MongoDB 문서로부터 변환
    public static NotificationResponse fromDocument(Notification document) {
        return NotificationResponse.builder()
                .id(document.getId())
                .recipientId(document.getRecipientId())
                .recipientNickname("") // 필요시 사용자 정보 조회 로직 추가
                .senderId(document.getSenderId())
                .senderNickname("")
                .type(document.getType())
                .title(document.getTitle())
                .content(document.getContent())
                .isRead(document.isRead())
                .referenceId(document.getReferenceId())
                .occurredAt(document.getOccurredAt() != null 
                        ? LocalDateTime.ofInstant(document.getOccurredAt(), ZoneId.systemDefault())
                        : null)
                .createdAt(document.getCreatedAt() != null 
                        ? LocalDateTime.ofInstant(document.getCreatedAt(), ZoneId.systemDefault())
                        : null)
                .lastUpdatedAt(document.getLastUpdatedAt() != null 
                        ? LocalDateTime.ofInstant(document.getLastUpdatedAt(), ZoneId.systemDefault())
                        : null)
                .deletedAt(document.getDeletedAt() != null 
                        ? LocalDateTime.ofInstant(document.getDeletedAt(), ZoneId.systemDefault())
                        : null)
                .build();
    }
} 