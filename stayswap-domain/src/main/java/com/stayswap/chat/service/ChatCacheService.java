package com.stayswap.chat.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stayswap.chat.model.dto.ChatroomCacheDto;
import com.stayswap.chat.model.dto.UserCacheDto;
import com.stayswap.chat.model.entity.Chatroom;
import com.stayswap.chat.repository.ChatroomRepository;
import com.stayswap.error.exception.NotFoundException;
import com.stayswap.user.model.entity.User;
import com.stayswap.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

import static com.stayswap.code.ErrorCode.NOT_EXISTS_CHATROOM;
import static com.stayswap.code.ErrorCode.NOT_EXISTS_USER;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatCacheService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;
    private final ChatroomRepository chatroomRepository;

    private static final String USER_CACHE_KEY_PREFIX = "user:";
    private static final String CHATROOM_CACHE_KEY_PREFIX = "chatroom:";
    private static final long CACHE_TTL_MINUTES = 10;

    public User getCachedUser(Long userId) {
        String userCacheKey = USER_CACHE_KEY_PREFIX + userId;
        Object cachedUserObj = redisTemplate.opsForValue().get(userCacheKey);
        
        if (cachedUserObj != null) {
            try {
                UserCacheDto cachedUser = objectMapper.convertValue(cachedUserObj, UserCacheDto.class);
                return cachedUser.toUser();
            } catch (Exception e) {
                log.warn("캐시된 사용자 객체 변환 실패: {}", e.getMessage());
            }
        }
        
        // Cache Miss - DB에서 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));
        
        // Redis에 DTO로 캐싱
        UserCacheDto userCacheDto = UserCacheDto.from(user);
        redisTemplate.opsForValue().set(userCacheKey, userCacheDto, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        
        return user;
    }

    public Chatroom getCachedChatroom(Long chatroomId) {
        String chatroomCacheKey = CHATROOM_CACHE_KEY_PREFIX + chatroomId;
        Object cachedChatroomObj = redisTemplate.opsForValue().get(chatroomCacheKey);
        
        if (cachedChatroomObj != null) {
            try {
                ChatroomCacheDto cachedChatroom = objectMapper.convertValue(cachedChatroomObj, ChatroomCacheDto.class);
                return cachedChatroom.toChatroom();
            } catch (Exception e) {
                log.warn("캐시된 채팅방 객체 변환 실패: {}", e.getMessage());
            }
        }
        
        // Cache Miss - DB에서 조회
        Chatroom chatroom = chatroomRepository.findById(chatroomId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_CHATROOM));
        
        // Redis에 DTO로 캐싱
        ChatroomCacheDto chatroomCacheDto = ChatroomCacheDto.from(chatroom);
        redisTemplate.opsForValue().set(chatroomCacheKey, chatroomCacheDto, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        
        return chatroom;
    }

    public void invalidateUserCache(Long userId) {
        String userCacheKey = USER_CACHE_KEY_PREFIX + userId;
        redisTemplate.delete(userCacheKey);
    }

    public void invalidateChatroomCache(Long chatroomId) {
        String chatroomCacheKey = CHATROOM_CACHE_KEY_PREFIX + chatroomId;
        redisTemplate.delete(chatroomCacheKey);
    }
}