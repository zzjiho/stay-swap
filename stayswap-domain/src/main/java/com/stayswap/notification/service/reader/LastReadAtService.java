package com.stayswap.notification.service.reader;

import com.stayswap.notification.repository.NotificationReadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * 알림 읽은 시간 관리 서비스
 */
@Service
@RequiredArgsConstructor
public class LastReadAtService {

    private final NotificationReadRepository notificationReadRepository;

    /**
     * 사용자의 알림 마지막 읽은 시간을 현재 시간으로 설정
     */
    public Instant setLastReadAt(Long userId) {
        return notificationReadRepository.setLastReadAt(userId);
    }

    /**
     * 사용자의 알림 마지막 읽은 시간 조회
     */
    public Instant getLastReadAt(Long userId) {
        return notificationReadRepository.getLastReadAt(userId);
    }
} 