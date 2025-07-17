package com.stayswap.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageEvent {
    private Long chatRoomId;
    private Long senderId;
    private String senderNickname;
    private String message;
    private LocalDateTime createdAt;
    private String eventType;
} 