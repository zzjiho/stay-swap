package com.stayswap.domains.notification.consumer;

import com.stayswap.domains.notification.model.dto.request.NotificationMessage;
import com.stayswap.domains.notification.service.NotificationService;
import com.stayswap.global.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationConsumer {

    private final NotificationService notificationService;

    /**
     * 알림 메시지 처리
     */
    @RabbitListener(queues = RabbitMQConfig.NOTIFICATION_QUEUE)
    public void processNotification(NotificationMessage message) {
        try {
            log.info("알림 메시지 수신: {}", message);
            notificationService.processNotification(message);
        } catch (Exception e) {
            log.error("알림 처리 중 오류 발생", e);
        }
    }
} 