package com.stayswap.chat.model.dto;

import com.stayswap.chat.model.entity.Chatroom;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ChatroomDto {
    private Long id;
    private String title;
    private LocalDateTime createdAt;

    public static ChatroomDto from(Chatroom chatroom) {
        ChatroomDto dto = new ChatroomDto();
        dto.setId(chatroom.getId());
        dto.setTitle(chatroom.getTitle());
        dto.setCreatedAt(chatroom.getCreatedAt());
        return dto;
    }
}