package com.stayswap.domains.notification.model.dto.request;

import com.stayswap.domains.notification.constant.NotificationType;
import lombok.*;

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
} 