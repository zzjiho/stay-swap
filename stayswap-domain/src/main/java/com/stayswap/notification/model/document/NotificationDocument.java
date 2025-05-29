package com.stayswap.notification.model.document;

import com.stayswap.notification.constant.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.TypeAlias;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "notifications")
@TypeAlias("Notification")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDocument {
    
    @Id
    private String id;
    
    @Indexed
    private Long recipientId;
    
    private Long senderId;
    
    private NotificationType type;
    private String title;
    private String content;
    private boolean isRead;
    private Long referenceId;
    
    private Instant createdAt;
    private Instant updatedAt;
    
    public static NotificationDocument of(Long recipientId, Long senderId,
                                         NotificationType type, String title, String content, Long referenceId) {
        Instant now = Instant.now();
        return NotificationDocument.builder()
                .recipientId(recipientId)
                .senderId(senderId)
                .type(type)
                .title(title)
                .content(content)
                .isRead(false)
                .referenceId(referenceId)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }
    
    public void markAsRead() {
        this.isRead = true;
        this.updatedAt = Instant.now();
    }
} 