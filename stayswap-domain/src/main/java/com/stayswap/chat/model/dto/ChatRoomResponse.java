package com.stayswap.chat.model.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class ChatRoomResponse {
    private Long chatRoomId;
    private String title;
    private String lastMessage;
    private Long unreadCount;
    private String partnerNickname;
    private boolean hasNewMessage;

    public static ChatRoomResponse from(Long chatRoomId, String title, String lastMessage, Long unreadCount, String partnerNickname, boolean hasNewMessage) {
        return ChatRoomResponse.builder()
                .chatRoomId(chatRoomId)
                .title(title)
                .lastMessage(lastMessage)
                .unreadCount(unreadCount)
                .partnerNickname(partnerNickname)
                .hasNewMessage(hasNewMessage)
                .build();
    }
}