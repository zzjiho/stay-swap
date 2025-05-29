package com.stayswap.notification.model.dto.response;

import com.stayswap.notification.constant.NotificationType;
import com.stayswap.notification.model.document.NotificationDocument;
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
    private LocalDateTime createdAt;
    
    // MongoDB 문서로부터 변환
    public static NotificationResponse fromDocument(NotificationDocument document) {
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
                .createdAt(LocalDateTime.ofInstant(document.getCreatedAt(), ZoneId.systemDefault()))
                .build();
    }
} 