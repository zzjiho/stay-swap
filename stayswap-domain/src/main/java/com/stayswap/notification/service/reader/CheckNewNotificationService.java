package com.stayswap.notification.service.reader;

import com.stayswap.notification.model.document.Notification;
import com.stayswap.notification.repository.NotificationMongoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

/**
 * 새 알림 여부 확인 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CheckNewNotificationService {

    private final NotificationMongoRepository notificationMongoRepository;
    private final LastReadAtService lastReadAtService;

    /**
     * 사용자의 새 알림 여부 확인
     */
    public boolean checkNewNotification(Long userId) {
        Instant latestUpdatedAt = getLatestUpdatedAt(userId);
        if (latestUpdatedAt == null) {
            return false;
        }

        Instant lastReadAt = lastReadAtService.getLastReadAt(userId);
        if (lastReadAt == null) { // 읽은 시간이 없으면 새 알림이 있는것
            return true;
        }

        return latestUpdatedAt.isAfter(lastReadAt);
    }

    /**
     * 사용자의 가장 최근 알림 업데이트 시간 조회
     */
    private Instant getLatestUpdatedAt(Long userId) {
        Optional<Notification> notification = notificationMongoRepository.findFirstByRecipientIdOrderByLastUpdatedAtDesc(userId);
        return notification.map(Notification::getLastUpdatedAt).orElse(null);
    }
} 