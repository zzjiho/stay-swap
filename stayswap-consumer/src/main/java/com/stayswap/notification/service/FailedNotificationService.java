package com.stayswap.notification.service;

import com.stayswap.notification.consumer.DlqConsumer;
import com.stayswap.notification.document.FailedNotification;
import com.stayswap.notification.repository.FailedNotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FailedNotificationService {

    private final FailedNotificationRepository failedNotificationRepository;
    private final DlqConsumer dlqConsumer;

    /**
     * 특정 기간 내 실패한 알림 메시지 조회
     */
    public List<FailedNotification> getFailedNotifications(LocalDateTime start, LocalDateTime end) {
        return failedNotificationRepository.findByCreatedAtBetween(start, end);
    }

    /**
     * 재처리되지 않은 실패 메시지 조회
     */
    public List<FailedNotification> getUnprocessedFailedNotifications() {
        return failedNotificationRepository.findByRetried(false);
    }

    /**
     * 특정 메시지 수동 재처리
     */
    public void retryFailedNotification(String id) {
        failedNotificationRepository.findById(id).ifPresent(dlqConsumer::retryFailedMessage);
    }

    /**
     * 모든 재처리되지 않은 메시지 재처리
     */
    public void retryAllUnprocessedFailedNotifications() {
        List<FailedNotification> unprocessed = getUnprocessedFailedNotifications();
        log.info("재처리되지 않은 실패 메시지 {} 개 재처리 시작", unprocessed.size());
        
        unprocessed.forEach(dlqConsumer::retryFailedMessage);
    }
}