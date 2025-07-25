package com.stayswap.notification.document;

import com.stayswap.notification.constant.NotificationType;
import com.stayswap.notification.dto.request.NotificationMessage;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.TypeAlias;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Getter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@TypeAlias("Notification")
@Document(collection = "notifications")
public abstract class Notification {
    
    @Id
    private String id;
    
    private Long recipientId;           // 알림 받는 사람 ID
    private Long senderId;              // 알림 보낸 사람 ID
    private Long referenceId;           // 참조 ID (예약ID, 교환ID 등)
    
    private String title;               // 알림 제목
    private String content;             // 알림 내용
    private NotificationType type;      // 알림 타입
    private boolean isRead;             // 읽음 여부
    
    // 시간 관련 필드
    private Instant occurredAt;         // 이벤트 발생 시간
    private Instant createdAt;          // 알림 생성 시간
    private Instant lastUpdatedAt;      // 마지막 업데이트 시간
    private Instant deletedAt;          // 알림이 삭제될 시간

    public static Notification of(Long recipientId, Long senderId,
                                  NotificationType type, String title, String content, 
                                  Long referenceId, Instant occurredAt) {
        return of(NotificationMessage.builder()
                .recipientId(recipientId)
                .senderId(senderId)
                .type(type)
                .title(title)
                .content(content)
                .referenceId(referenceId)
                .occurredAt(occurredAt)
                .build());
    }
    
    public static Notification of(NotificationMessage message) {
        Instant now = Instant.now();
        Instant occurredAt = message.getOccurredAt() != null ? message.getOccurredAt() : now;
        
        switch (message.getType()) {
            case BOOKING_REQUEST:
            case BOOKING_ACCEPTED:
            case BOOKING_REJECTED:
            case BOOKING_EXPIRED:
            case CHECK_IN:
            case CHECK_OUT:
                return BookingNotification.builder()
                        .recipientId(message.getRecipientId())
                        .senderId(message.getSenderId())
                        .type(message.getType())
                        .title(message.getTitle())
                        .content(message.getContent())
                        .isRead(false)
                        .referenceId(message.getReferenceId())
                        .occurredAt(occurredAt)
                        .createdAt(now)
                        .lastUpdatedAt(now)
                        .build();
                        
            case SWAP_REQUEST:
            case SWAP_ACCEPTED:
            case SWAP_REJECTED:
            case SWAP_EXPIRED:
                return SwapNotification.builder()
                        .recipientId(message.getRecipientId())
                        .senderId(message.getSenderId())
                        .type(message.getType())
                        .title(message.getTitle())
                        .content(message.getContent())
                        .isRead(false)
                        .referenceId(message.getReferenceId())
                        .occurredAt(occurredAt)
                        .createdAt(now)
                        .lastUpdatedAt(now)
                        .build();
                        
            case LIKE_ADDED:
            case LIKE_REMOVED:
                return LikeNotification.builder()
                        .recipientId(message.getRecipientId())
                        .senderId(message.getSenderId())
                        .type(message.getType())
                        .title(message.getTitle())
                        .content(message.getContent())
                        .isRead(false)
                        .referenceId(message.getReferenceId())
                        .occurredAt(occurredAt)
                        .createdAt(now)
                        .lastUpdatedAt(now)
                        .accommodationId(message.getAccommodationId())
                        .accommodationName(message.getAccommodationName())
                        .build();
                        
            case TEST_NOTIFICATION:
            default:
                return TestNotification.builder()
                        .recipientId(message.getRecipientId())
                        .senderId(message.getSenderId())
                        .type(message.getType())
                        .title(message.getTitle())
                        .content(message.getContent())
                        .isRead(false)
                        .referenceId(message.getReferenceId())
                        .occurredAt(occurredAt)
                        .createdAt(now)
                        .lastUpdatedAt(now)
                        .build();
        }
    }
}