package com.stayswap.notification.service.domain.swap;

import com.stayswap.notification.constant.NotificationType;
import com.stayswap.notification.dto.request.NotificationMessage;
import com.stayswap.notification.producer.NotificationPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 교환 요청 알림 서비스
 * 교환 요청과 관련된 알림 처리를 담당
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SwapNotificationService {

    private final NotificationPublisher notificationPublisher;

    /**
     * 교환 요청 알림 생성
     */
    public void createSwapRequestNotification(Long recipientId, Long senderId, Long swapId) {
        NotificationMessage message = NotificationMessage.builder()
                .recipientId(recipientId)
                .senderId(senderId)
                .type(NotificationType.SWAP_REQUEST)
                .title("[교환 요청]")
                .content("새로운 숙소 교환 요청이 도착했습니다. 지금 바로 확인해보세요!")
                .referenceId(swapId)
                .build();
        
        notificationPublisher.sendNotification(message);
        log.info("교환 요청 알림 생성 완료 - recipientId: {}, swapId: {}", recipientId, swapId);
    }
    
    /**
     * 교환 요청 승인 알림 생성
     */
    public void createSwapAcceptedNotification(Long recipientId, Long senderId, Long swapId) {
        NotificationMessage message = NotificationMessage.builder()
                .recipientId(recipientId)
                .senderId(senderId)
                .type(NotificationType.SWAP_ACCEPTED)
                .title("[교환 요청 승인]")
                .content("요청하신 숙소 교환이 승인되었습니다. 일정을 확인해보세요!")
                .referenceId(swapId)
                .build();
        
        notificationPublisher.sendNotification(message);
        log.info("교환 승인 알림 생성 완료 - recipientId: {}, swapId: {}", recipientId, swapId);
    }
    
    /**
     * 교환 요청 거절 알림 생성
     */
    public void createSwapRejectedNotification(Long recipientId, Long senderId, Long swapId) {
        NotificationMessage message = NotificationMessage.builder()
                .recipientId(recipientId)
                .senderId(senderId)
                .type(NotificationType.SWAP_REJECTED)
                .title("[교환 요청 결과]")
                .content("아쉽게도 요청하신 숙소 교환이 상대방의 사정으로 성사되지 않았습니다. 다양한 교환 가능한 숙소들이 기다리고 있으니 새로운 교환 기회를 찾아보세요!")
                .referenceId(swapId)
                .build();
        
        notificationPublisher.sendNotification(message);
        log.info("교환 거절 알림 생성 완료 - recipientId: {}, swapId: {}", recipientId, swapId);
    }
} 