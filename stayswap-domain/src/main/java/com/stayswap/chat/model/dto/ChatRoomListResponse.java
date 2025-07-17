package com.stayswap.chat.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public class ChatRoomListResponse {
    private List<ChatRoomResponse> chatRooms;
    private long totalCount;

}