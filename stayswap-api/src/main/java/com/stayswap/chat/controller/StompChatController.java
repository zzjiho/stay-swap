package com.stayswap.chat.controller;

import com.stayswap.chat.model.dto.ChatMessageResponse;
import com.stayswap.chat.service.ChatService;
import com.stayswap.common.util.JwtWebSocketUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.stereotype.Controller;

import java.util.Map;


@Slf4j
@Controller
@RequiredArgsConstructor
public class StompChatController {

    private final ChatService chatService;
    private final JwtWebSocketUtils jwtWebSocketUtils;

    /**
     * 1:1 채팅 메시지 처리
     * 클라이언트에서 /pub/chats/{chatRoomId}로 메시지 발송
     * /sub/chats/{chatRoomId}를 구독한 사용자들에게 메시지 전달
     */
    @MessageMapping("/chats/{chatRoomId}")
    @SendTo("/sub/chats/{chatRoomId}")
    public ChatMessageResponse handleMessage(
            @DestinationVariable("chatRoomId") Long chatRoomId,
            @Payload Map<String, String> payload,
            @Header("Authorization") String authorization) {

        Long userId = jwtWebSocketUtils.extractUserIdFromToken(authorization);

        ChatMessageResponse chatMessageResponse =
                chatService.getChatMessageResponse(chatRoomId, payload, userId);

        return chatMessageResponse;
    }

}
