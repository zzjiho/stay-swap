package com.stayswap.chat.consumer;

import com.stayswap.chat.dto.ChatMessageEvent;
import com.stayswap.chat.constant.ChatEventType;
import com.stayswap.chat.model.entity.ChatMember;
import com.stayswap.chat.model.entity.Chatroom;
import com.stayswap.chat.repository.ChatMemberRepository;
import com.stayswap.chat.repository.ChatroomRepository;
import com.stayswap.notification.consumer.core.PushNotificationService;
import com.stayswap.notification.constant.NotificationType;
import com.stayswap.user.model.entity.User;
import com.stayswap.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.function.Consumer;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChatMessageConsumer {

    private final ChatMemberRepository chatMemberRepository;
    private final PushNotificationService pushNotificationService;

    /**
     * Kafka 스트림으로부터 채팅 메시지 이벤트 처리
     */
    @Bean("chatMessage")
    public Consumer<ChatMessageEvent> chatMessage() {
        return event -> {
            log.info("채팅 메시지 이벤트 수신: {}", event);
            processChatMessage(event);
        };
    }

    /**
     * 채팅 메시지 이벤트 처리
     */
    private void processChatMessage(ChatMessageEvent event) {
<<<<<<< Updated upstream
        try {
            ChatEventType eventType = ChatEventType.valueOf(event.getEventType());
            
            switch (eventType) {
                case MESSAGE_SENT:
                    handleMessageSent(event);
                    break;
                default:
                    log.warn("알 수 없는 채팅 이벤트 타입: {}", eventType);
            }
        } catch (Exception e) {
            log.error("채팅 메시지 처리 중 오류 발생: {}", e.getMessage(), e);
=======
        ChatEventType eventType = ChatEventType.valueOf(event.getEventType());
        
        switch (eventType) {
            case MESSAGE_SENT:
                handleMessageSent(event);
                break;
            default:
                log.warn("알 수 없는 채팅 이벤트 타입: {}", eventType);
>>>>>>> Stashed changes
        }
    }

    /**
     * 메시지 전송 이벤트 처리
     */
    private void handleMessageSent(ChatMessageEvent event) {
        // 채팅방 멤버 조회 (발신자 제외)
        List<ChatMember> members = chatMemberRepository.findByChatroomId(event.getChatRoomId());
        
        for (ChatMember member : members) {
            // 발신자는 제외
            if (member.getUser().getId().equals(event.getSenderId())) {
                continue;
            }
            
            User recipient = member.getUser();
            
            // 푸시 알림 허용한 사용자에게만 FCM 전송
            if (recipient.getPushNotificationYN()) {
                String title = event.getSenderNickname() + "님의 메시지";
                String content = event.getMessage();
                
                pushNotificationService.sendPushNotificationToUser(
                        recipient.getId(),
                        title,
                        content,
                        NotificationType.CHAT_MESSAGE,
                        event.getChatRoomId()
                );
                
                log.info("채팅 푸시 알림 전송 완료: recipientId={}, senderId={}, chatRoomId={}", 
                        recipient.getId(), event.getSenderId(), event.getChatRoomId());
            } else {
                log.info("푸시 알림 거부된 사용자: recipientId={}", recipient.getId());
            }
        }
    }
}