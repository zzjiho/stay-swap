package com.stayswap.chat.service;

import com.stayswap.chat.model.dto.ChatMessageResponse;
import com.stayswap.chat.model.dto.ChatRoomResponse;
import com.stayswap.chat.model.dto.ChatroomDto;
import com.stayswap.chat.model.dto.ChatRoomListDto;
import com.stayswap.chat.model.entity.ChatMember;
import com.stayswap.chat.model.entity.Chatroom;
import com.stayswap.chat.model.entity.Message;
import com.stayswap.chat.repository.ChatMemberRepository;
import com.stayswap.chat.repository.ChatroomRepository;
import com.stayswap.chat.repository.MessageRepository;
import com.stayswap.error.exception.BusinessException;
import com.stayswap.chat.constant.ChatEventType;
import com.stayswap.chat.dto.ChatMessageEvent;
import com.stayswap.chat.producer.ChatMessagePublisher;
import com.stayswap.error.exception.ForbiddenException;
import com.stayswap.error.exception.NotFoundException;
import com.stayswap.house.model.entity.House;
import com.stayswap.house.repository.HouseRepository;
import com.stayswap.user.model.entity.User;
import com.stayswap.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static com.stayswap.code.ErrorCode.*;

@Slf4j
@RequiredArgsConstructor
@Service
public class ChatService {

    private final ChatroomRepository chatroomRepository;
    private final ChatMemberRepository chatMemberRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final HouseRepository houseRepository;
    private final ChatMessagePublisher chatMessagePublisher;

    @Transactional
    public ChatRoomResponse createOrGetHouseInquiryChatRoom(Long userId, Long houseId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));
        
        House house = houseRepository.findById(houseId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_HOUSE));
        
        User host = house.getUser();
        
        // 게스트와 호스트 간의 1:1 채팅방이 이미 존재하는지 확인
        Optional<Chatroom> existingChatroomOptional = chatroomRepository.findDirectChatroomBetweenUsers(userId, host.getId());

        Chatroom chatroom;
        if (existingChatroomOptional.isPresent()) {
            chatroom = existingChatroomOptional.get();
        } else {
            // 새로운 채팅방 생성
            String title = house.getTitle() + " - " + user.getNickname() + " & " + host.getNickname();
            chatroom = createChatroom(user, title);

            // 호스트를 채팅방에 추가
            ChatMember hostMapping = chatroom.addMember(host);
            chatMemberRepository.save(hostMapping);
        }

        return buildChatRoomResponse(chatroom, userId, host.getNickname());
    }

    private ChatRoomResponse buildChatRoomResponse(Chatroom chatroom, Long userId, String partnerNickname) {
        // 마지막 메시지 조회
        String lastMessage = null;
        Optional<Message> lastMessageOpt = messageRepository.findTopByChatroomIdOrderByCreatedAtDesc(chatroom.getId());
        if (lastMessageOpt.isPresent()) {
            lastMessage = lastMessageOpt.get().getText();
        }

        // 읽지 않은 메시지 수 계산
        Long unreadCount = 0L;
        boolean hasNewMessage = false;
        
        Optional<ChatMember> memberOpt = chatMemberRepository.findByUserIdAndChatroomId(userId, chatroom.getId());
        if (memberOpt.isPresent()) {
            ChatMember member = memberOpt.get();
            if (member.getLastCheckedAt() != null) {
                unreadCount = messageRepository.countByChatroomIdAndCreatedAtAfter(chatroom.getId(), member.getLastCheckedAt());
            }
            hasNewMessage = unreadCount > 0;
        }

        return ChatRoomResponse.from(chatroom.getId(), chatroom.getTitle(), lastMessage, unreadCount, partnerNickname, hasNewMessage);
    }

    @Transactional
    public Boolean leaveChatroom(Long userId, Long chatroomId) {
        if (!chatMemberRepository.existsByUserIdAndChatroomId(userId, chatroomId)) {
            throw new BusinessException(CANNOT_LEAVE_CHATROOM);
        }

        chatMemberRepository.deleteByUserIdAndChatroomId(userId, chatroomId);

        return true;
    }

    // 채팅방 목록 조회 (DTO 변환)
    public Slice<ChatRoomListDto> getChatroomList(Long userId, Pageable pageable) {
        Slice<ChatMember> chatMemberSlice = chatMemberRepository.findAllByUserId(userId, pageable);

        List<ChatRoomListDto> chatroomDtos = chatMemberSlice.stream()
            .map(chatMember -> {
                Chatroom chatroom = chatMember.getChatroom();
                chatroom.setHasNewMessage(
                    // 해당 채팅방의 마지막 확인 시간 이후에 새 메시지가 있는지 확인
                    messageRepository.existsByChatroomIdAndCreatedAtAfter(chatroom.getId(), chatMember.getLastCheckedAt()));
                
                // DTO로 변환
                ChatRoomListDto dto = ChatRoomListDto.from(chatroom, userId);
                
                // 마지막 메시지 정보 추가
                Optional<Message> lastMessageOpt = messageRepository.findTopByChatroomIdOrderByCreatedAtDesc(chatroom.getId());
                if (lastMessageOpt.isPresent()) {
                    Message lastMessage = lastMessageOpt.get();
                    dto.setLastMessage(lastMessage.getText());
                    dto.setLastMessageCreatedAt(lastMessage.getCreatedAt());
                }
                
                // 읽지 않은 메시지 수 계산
                Long unreadCount = 0L;
                if (chatMember.getLastCheckedAt() != null) {
                    unreadCount = messageRepository.countByChatroomIdAndCreatedAtAfter(chatroom.getId(), chatMember.getLastCheckedAt());
                }
                dto.setUnreadCount(unreadCount);
                
                return dto;
            })
            .toList();

        return new SliceImpl<>(chatroomDtos, pageable, chatMemberSlice.hasNext());
    }

    @Transactional(readOnly = true)
    public Slice<ChatMessageResponse> getMessageList(Long chatroomId, Long userId, Pageable pageable) {

        if (!chatMemberRepository.existsByUserIdAndChatroomId(userId, chatroomId)) {
            throw new ForbiddenException(NOT_MEMBER_OF_CHATROOM);
        }
        
        if (!chatroomRepository.existsById(chatroomId)) {
            throw new NotFoundException(NOT_EXISTS_CHATROOM);
        }
        
        Slice<Message> messageSlice = messageRepository.findByChatroomIdOrderByCreatedAtAsc(chatroomId, pageable);

        return messageSlice.map(ChatMessageResponse::of);
    }

    @Transactional(readOnly = true)
    public ChatroomDto getChatroom(Long chatroomId, Long userId) {
        if (!chatMemberRepository.existsByUserIdAndChatroomId(userId, chatroomId)) {
            throw new ForbiddenException(NOT_MEMBER_OF_CHATROOM);
        }

        Chatroom chatroom = chatroomRepository.findById(chatroomId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_CHATROOM));

        return ChatroomDto.from(chatroom);
    }

    public Message saveMessage(Long userId, Long chatroomId, String text) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));
        Chatroom chatroom = chatroomRepository.findById(chatroomId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_CHATROOM));

        Message message = Message.builder()
                .text(text)
                .user(user)
                .chatroom(chatroom)
                .createdAt(LocalDateTime.now())
                .build();

        Message savedMessage = messageRepository.save(message);
        
        // Kafka로 채팅 메시지 이벤트 발행
        ChatMessageEvent event = ChatMessageEvent.builder()
                .chatRoomId(chatroomId)
                .senderId(user.getId())
                .senderNickname(user.getNickname())
                .message(text)
                .createdAt(savedMessage.getCreatedAt())
                .eventType(ChatEventType.MESSAGE_SENT.name())
                .build();
        chatMessagePublisher.sendChatMessage(event);
        
        return savedMessage;
    }

    public Chatroom createChatroom(User user, String title) {
        Chatroom chatroom = Chatroom.builder()
            .title(title)
            .createdAt(LocalDateTime.now())
            .build();

        chatroom = chatroomRepository.save(chatroom);

        ChatMember chatMember = chatroom.addMember(user);
        chatMember = chatMemberRepository.save(chatMember);

        return chatroom;
    }

    public void updateLastCheckedAt(Long userId, Long currentChatroomId) {
        ChatMember chatMember =
                chatMemberRepository.findByUserIdAndChatroomId(userId, currentChatroomId)
                        .orElseThrow(() -> new ForbiddenException(NOT_MEMBER_OF_CHATROOM));

        chatMember.updateLastCheckedAt();

        chatMemberRepository.save(chatMember);
    }
}
