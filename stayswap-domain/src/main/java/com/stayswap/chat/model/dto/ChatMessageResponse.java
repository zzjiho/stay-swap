package com.stayswap.chat.model.dto;

import com.stayswap.chat.model.entity.Message;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponse {
    private String sender;
    private String message;
    private String createdAt;
    
    public static ChatMessageResponse of(Message message) {
        return new ChatMessageResponse(
                message.getUser().getNickname(),
                message.getText(),
                message.getCreatedAt().toString()
        );
    }
}
