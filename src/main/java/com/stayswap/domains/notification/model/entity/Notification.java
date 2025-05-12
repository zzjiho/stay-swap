package com.stayswap.domains.notification.model.entity;

import com.stayswap.domains.common.entity.BaseTimeEntity;
import com.stayswap.domains.notification.constant.NotificationType;
import com.stayswap.domains.user.model.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "notification")
public class Notification extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 500)
    private String content;

    @Column(nullable = false)
    private boolean isRead;

    @Column
    private Long referenceId; // 관련 객체 ID (숙박/교환 요청 ID 등)

    @Builder
    public Notification(User recipient, User sender, NotificationType type, String title, String content, Long referenceId) {
        this.recipient = recipient;
        this.sender = sender;
        this.type = type;
        this.title = title;
        this.content = content;
        this.isRead = false;
        this.referenceId = referenceId;
    }

    public void markAsRead() {
        this.isRead = true;
    }
} 