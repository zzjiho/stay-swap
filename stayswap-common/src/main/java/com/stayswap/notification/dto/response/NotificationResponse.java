package com.stayswap.notification.dto.response;

import com.stayswap.notification.constant.NotificationType;
import com.stayswap.notification.document.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private String id;                  // 알림 ID
    private Long recipientId;           // 수신자 ID
    private Long senderId;              // 발신자 ID
    private Long referenceId;           // 참조 ID (예약, 교환 등)
    private String title;               // 알림 제목
    private String content;             // 알림 내용
    private NotificationType type;      // 알림 타입
    private boolean isRead;             // 읽음 여부
    private Instant occurredAt;         // 이벤트 발생 시간
    private Instant createdAt;          // 생성 시간

    public static NotificationResponse from(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .recipientId(notification.getRecipientId())
                .senderId(notification.getSenderId())
                .referenceId(notification.getReferenceId())
                .title(notification.getTitle())
                .content(notification.getContent())
                .type(notification.getType())
                .isRead(notification.isRead())
                .occurredAt(notification.getOccurredAt())
                .createdAt(notification.getCreatedAt())
                .build();
    }
} 