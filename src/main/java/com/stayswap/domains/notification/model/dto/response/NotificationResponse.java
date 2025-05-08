package com.stayswap.domains.notification.model.dto.response;

import com.stayswap.domains.notification.constant.NotificationType;
import com.stayswap.domains.notification.model.entity.Notification;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class NotificationResponse {
    private Long id;
    private Long recipientId;
    private String recipientNickname;
    private Long senderId;
    private String senderNickname;
    private NotificationType type;
    private String title;
    private String content;
    private boolean isRead;
    private Long referenceId;
    private LocalDateTime createdAt;

    public static NotificationResponse from(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .recipientId(notification.getRecipient().getId())
                .recipientNickname(notification.getRecipient().getNickname())
                .senderId(notification.getSender().getId())
                .senderNickname(notification.getSender().getNickname())
                .type(notification.getType())
                .title(notification.getTitle())
                .content(notification.getContent())
                .isRead(notification.isRead())
                .referenceId(notification.getReferenceId())
                .build();
    }
} 