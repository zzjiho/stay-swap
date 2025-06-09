package com.stayswap.notification.service.core;

import com.stayswap.notification.model.dto.request.NotificationMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.stream.function.StreamBridge;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


/**
 * 코어 알림 서비스
 * 알림 전송, 저장, 조회 등의 기본 기능을 담당
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class NotificationPublisher {

    private final StreamBridge streamBridge;

    /**
     * 알림 메시지를 Kafka로 전송
     */
    public void sendNotification(NotificationMessage message) {
        streamBridge.send("notification-out-0", message);
        log.info("알림 메시지 전송 완료: {}", message);
    }

}