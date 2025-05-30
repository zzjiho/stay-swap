package com.stayswap.notification.model.dto.request;

import com.stayswap.notification.constant.NotificationType;
import lombok.*;

import java.time.Instant;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class NotificationMessage {
    private Long recipientId;
    private Long senderId;
    private NotificationType type;
    private String title;
    private String content;
    private Long referenceId;
    
    // 이벤트 발생 시간 (null일 경우 현재 시간 사용)
    private Instant occurredAt;
} 