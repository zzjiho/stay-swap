package com.stayswap.chat.model.dto;

import com.stayswap.chat.model.entity.Chatroom;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatroomCacheDto {
    
    private Long id;
    private String title;
    private LocalDateTime createdAt;
    
    public static ChatroomCacheDto from(Chatroom chatroom) {
        return ChatroomCacheDto.builder()
                .id(chatroom.getId())
                .title(chatroom.getTitle())
                .createdAt(chatroom.getCreatedAt())
                .build();
    }
    
    public Chatroom toChatroom() {
        return Chatroom.builder()
                .id(this.id)
                .title(this.title)
                .createdAt(this.createdAt)
                .build();
    }
}