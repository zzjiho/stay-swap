package com.stayswap.chat.producer;

import com.stayswap.chat.dto.ChatMessageEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.stream.function.StreamBridge;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 채팅 메시지 발행 서비스
 * 채팅 메시지를 Kafka로 전송하여 비동기 처리
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ChatMessagePublisher {

    private final StreamBridge streamBridge;

    /**
     * 채팅 메시지 이벤트를 Kafka로 전송
     */
    public void sendChatMessage(ChatMessageEvent event) {
        streamBridge.send("chatMessage-out-0", event);

        log.info("채팅 메시지 이벤트 전송 완료: chatRoomId={}, senderId={}, eventType={}",
                event.getChatRoomId(), event.getSenderId(), event.getEventType());
    }
} 