package com.stayswap.notification.model.dto.request;

import com.stayswap.notification.constant.NotificationType;
import lombok.*;

import java.time.Instant;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class LikeNotificationMessage {
    private Long recipientId;
    private Long senderId;
    private NotificationType type;
    private String title;
    private String content;
    private Long referenceId;
    
    // 이벤트 발생 시간 (null일 경우 현재 시간 사용)
    private Instant occurredAt;
    
    // 좋아요 알림 관련 필드
    private Long accommodationId;    // 좋아요 받은 숙소 ID
    private String accommodationName; // 숙소 이름
} 