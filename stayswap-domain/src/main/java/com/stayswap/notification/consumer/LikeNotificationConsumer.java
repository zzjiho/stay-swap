package com.stayswap.notification.consumer;

import com.stayswap.notification.model.dto.request.LikeNotificationMessage;
import com.stayswap.notification.model.dto.request.NotificationMessage;
import com.stayswap.notification.service.core.LikeNotificationPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

import java.util.function.Consumer;

@Slf4j
@Component
@RequiredArgsConstructor
public class LikeNotificationConsumer {

    private final LikeNotificationPublisher likenotificationPublisher;

    /**
     * Kafka 스트림으로부터 알림 메시지 처리
     */
    @Bean("likeNotification")
    public Consumer<NotificationMessage> likeNotification() {
        return message -> {
            try {
                log.info("알림 메시지 수신: {}", message);
                likenotificationPublisher.processLikeNotification(message);
            } catch (Exception e) {
                // todo: handle exception
                log.error("알림 처리 중 오류 발생", e);
            }
        };
    }
}