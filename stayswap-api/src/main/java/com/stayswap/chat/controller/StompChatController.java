package com.stayswap.chat.controller;

import com.stayswap.chat.model.dto.ChatMessageResponse;
import com.stayswap.chat.model.dto.ChatroomDto;
import com.stayswap.chat.service.ChatService;
import com.stayswap.error.exception.NotFoundException;
import com.stayswap.user.model.entity.User;
import com.stayswap.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import com.stayswap.jwt.service.TokenManager;
import io.jsonwebtoken.Claims;

import java.time.LocalDateTime;
import java.util.Map;

import static com.stayswap.code.ErrorCode.NOT_EXISTS_USER;

@Slf4j
@Controller
@RequiredArgsConstructor
public class StompChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;
    private final TokenManager tokenManager;

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

        // STOMP에서는 custom argument resolver를 쓸 수 없다.
        String token = authorization.replace("Bearer ", "");
        Claims claims = tokenManager.getTokenClaims(token);
        Long userId = Long.valueOf((Integer) claims.get("userId"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));
        
        // 메시지 저장
        chatService.saveMessage(user.getId(), chatRoomId, payload.get("message"));
        
        // 채팅방 목록 업데이트 알림 (새 메시지 표시용)
        ChatroomDto chatroom = chatService.getChatroom(chatRoomId, userId);
        messagingTemplate.convertAndSend("/sub/chats/updates", chatroom);
        
        // 실시간 메시지 응답
        return new ChatMessageResponse(
                user.getNickname(), 
                payload.get("message"),
                LocalDateTime.now().toString()
        );
    }

    /**
     * 사용자 채팅방 입장 처리
     * 클라이언트에서 /pub/chats/{chatRoomId}/join 호출
     */
    @MessageMapping("/chats/{chatRoomId}/join")
    @SendTo("/sub/chats/{chatRoomId}")
    public ChatMessageResponse handleUserJoin(
            @DestinationVariable("chatRoomId") Long chatRoomId,
            @Header("Authorization") String authorization) {

        String token = authorization.replace("Bearer ", "");
        Claims claims = tokenManager.getTokenClaims(token);
        Long userId = Long.valueOf((Integer) claims.get("userId"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));
        
        return new ChatMessageResponse(
                "System", 
                user.getNickname() + "님이 입장했습니다.",
                LocalDateTime.now().toString()
        );
    }
}
