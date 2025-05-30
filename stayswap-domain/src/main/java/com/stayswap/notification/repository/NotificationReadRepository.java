package com.stayswap.notification.repository;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.concurrent.TimeUnit;

@Repository
public class NotificationReadRepository {

    private final RedisTemplate<String, String> redisTemplate;

    public NotificationReadRepository(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * 사용자의 알림 마지막 읽은 시간을 설정
     * Redis에 90일 TTL로 저장
     */
    public Instant setLastReadAt(Long userId) {
        long lastReadAt = Instant.now().toEpochMilli();
        String key = getKey(userId);
        redisTemplate.opsForValue().set(key, String.valueOf(lastReadAt));
        redisTemplate.expire(key, 90, TimeUnit.DAYS); // 90일 TTL 설정
        return Instant.ofEpochMilli(lastReadAt);
    }

    /**
     * 사용자의 알림 마지막 읽은 시간 조회
     */
    public Instant getLastReadAt(Long userId) {
        String key = getKey(userId);
        String lastReadAtStr = redisTemplate.opsForValue().get(key);
        if (lastReadAtStr == null) {
            return null;
        }

        long lastReadAtLong = Long.parseLong(lastReadAtStr);
        return Instant.ofEpochMilli(lastReadAtLong);
    }

    /**
     * Redis 키 생성
     */
    private String getKey(Long userId) {
        return "notification:" + userId + ":lastReadAt";
    }
} 