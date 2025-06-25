package com.stayswap.notification.service.reader;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class IndividualNotificationReadService {

    private final RedisTemplate<String, String> redisTemplate;
    private static final String READ_NOTIFICATIONS_KEY_PREFIX = "user:%d:read_notifications";
    private static final Duration EXPIRATION_DURATION = Duration.ofDays(90);

    /**
     * 특정 알림을 읽음 처리합니다.
     */
    public void markAsRead(Long userId, String notificationId) {
        String key = String.format(READ_NOTIFICATIONS_KEY_PREFIX, userId);
        
        try {
            redisTemplate.opsForSet().add(key, notificationId);
            redisTemplate.expire(key, EXPIRATION_DURATION);
            
            log.info("알림 읽음 처리 완료: userId={}, notificationId={}", userId, notificationId);
            
        } catch (Exception e) {
            log.error("알림 읽음 처리 실패: userId={}, notificationId={}", userId, notificationId, e);
        }
    }

    /**
     * 사용자가 읽은 모든 알림 ID 목록을 조회
     */
    public Set<String> getReadNotificationIds(Long userId) {
        String key = String.format(READ_NOTIFICATIONS_KEY_PREFIX, userId);
        
        try {
            Set<String> readIds = redisTemplate.opsForSet().members(key);
            return readIds != null ? readIds : Set.of();
        } catch (Exception e) {
            log.error("읽은 알림 ID 조회 실패: userId={}", userId, e);
            return Set.of();
        }
    }
}