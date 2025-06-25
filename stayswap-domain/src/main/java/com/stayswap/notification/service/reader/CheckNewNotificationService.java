package com.stayswap.notification.service.reader;

import com.stayswap.notification.document.Notification;
import com.stayswap.notification.repository.NotificationMongoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CheckNewNotificationService {

    private final NotificationMongoRepository notificationMongoRepository;
    private final IndividualNotificationReadService individualNotificationReadService;

    /**
     * 새 알림 여부 확인
     */
    public boolean checkNewNotification(Long userId) {

        List<Notification> notifications = notificationMongoRepository
            .findTop100ByRecipientIdOrderByOccurredAtDesc(userId);
        
        if (notifications.isEmpty()) {
            return false;
        }
        
        log.info("확인할 알림 수: userId={}, count={}", userId, notifications.size());
        
        // 개별 읽음 상태 확인
        Set<String> readNotificationIds = individualNotificationReadService.getReadNotificationIds(userId);
        log.debug("읽은 알림 ID 수: userId={}, readCount={}", userId, readNotificationIds.size());
        
        boolean hasUnread = notifications.stream()
                .anyMatch(notification -> !readNotificationIds.contains(notification.getId()));
        
        return hasUnread;
    }
} 