package com.stayswap.notification.service.core;

import com.stayswap.notification.model.dto.request.NotificationMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.stream.function.StreamBridge;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


/**
 * 좋아요 알림 이벤트
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class LikeNotificationPublisher {

    private final StreamBridge streamBridge;

    /**
     * 알림 메시지를 Kafka로 전송
     */
    public void sendNotification(NotificationMessage message) {
        streamBridge.send("likeNotification-out-0", message);
        log.info("좋아요 알림 메시지 전송 완료: {}", message);
    }

}