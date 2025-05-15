package com.stayswap.domains.notification.service;

import com.stayswap.domains.notification.constant.NotificationType;
import com.stayswap.domains.notification.model.dto.request.NotificationMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 교환/숙박 요청 알림 서비스
 * 숙박 및 교환 요청과 관련된 알림 처리를 담당
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SwapRequestNotificationService {

    private final NotificationService notificationService;

    /**
     * 숙박 요청 알림 생성
     */
    public void createBookingRequestNotification(Long recipientId, Long senderId, Long bookingId) {
        NotificationMessage message = NotificationMessage.builder()
                .recipientId(recipientId)
                .senderId(senderId)
                .type(NotificationType.BOOKING_REQUEST)
                .title("새로운 숙박 요청")
                .content("새로운 숙박 요청이 도착했습니다. 지금 바로 확인해보세요.")
                .referenceId(bookingId)
                .build();
        
        notificationService.sendNotification(message);
        log.info("숙박 요청 알림 생성 완료 - recipientId: {}, bookingId: {}", recipientId, bookingId);
    }

    /**
     * 교환 요청 알림 생성
     */
    public void createSwapRequestNotification(Long recipientId, Long senderId, Long swapId) {
        NotificationMessage message = NotificationMessage.builder()
                .recipientId(recipientId)
                .senderId(senderId)
                .type(NotificationType.SWAP_REQUEST)
                .title("새로운 교환 요청")
                .content("새로운 숙소 교환 요청이 도착했습니다. 지금 바로 확인해보세요.")
                .referenceId(swapId)
                .build();
        
        notificationService.sendNotification(message);
        log.info("교환 요청 알림 생성 완료 - recipientId: {}, swapId: {}", recipientId, swapId);
    }
    
    /**
     * 숙박 요청 승인 알림 생성
     */
    public void createBookingAcceptedNotification(Long recipientId, Long senderId, Long bookingId) {
        NotificationMessage message = NotificationMessage.builder()
                .recipientId(recipientId)
                .senderId(senderId)
                .type(NotificationType.BOOKING_ACCEPTED)
                .title("숙박 요청 승인")
                .content("요청하신 숙박이 승인되었습니다. 일정을 확인해보세요.")
                .referenceId(bookingId)
                .build();
        
        notificationService.sendNotification(message);
        log.info("숙박 승인 알림 생성 완료 - recipientId: {}, bookingId: {}", recipientId, bookingId);
    }
    
    /**
     * 교환 요청 승인 알림 생성
     */
    public void createSwapAcceptedNotification(Long recipientId, Long senderId, Long swapId) {
        NotificationMessage message = NotificationMessage.builder()
                .recipientId(recipientId)
                .senderId(senderId)
                .type(NotificationType.SWAP_ACCEPTED)
                .title("교환 요청 승인")
                .content("요청하신 숙소 교환이 승인되었습니다. 일정을 확인해보세요.")
                .referenceId(swapId)
                .build();
        
        notificationService.sendNotification(message);
        log.info("교환 승인 알림 생성 완료 - recipientId: {}, swapId: {}", recipientId, swapId);
    }
    
    /**
     * 숙박 요청 거절 알림 생성
     */
    public void createBookingRejectedNotification(Long recipientId, Long senderId, Long bookingId) {
        NotificationMessage message = NotificationMessage.builder()
                .recipientId(recipientId)
                .senderId(senderId)
                .type(NotificationType.BOOKING_REJECTED)
                .title("숙박 요청 거절")
                .content("요청하신 숙박이 거절되었습니다. 다른 숙소를 찾아보세요.")
                .referenceId(bookingId)
                .build();
        
        notificationService.sendNotification(message);
        log.info("숙박 거절 알림 생성 완료 - recipientId: {}, bookingId: {}", recipientId, bookingId);
    }
    
    /**
     * 교환 요청 거절 알림 생성
     */
    public void createSwapRejectedNotification(Long recipientId, Long senderId, Long swapId) {
        NotificationMessage message = NotificationMessage.builder()
                .recipientId(recipientId)
                .senderId(senderId)
                .type(NotificationType.SWAP_REJECTED)
                .title("교환 요청 거절")
                .content("요청하신 숙소 교환이 거절되었습니다. 다른 숙소를 찾아보세요.")
                .referenceId(swapId)
                .build();
        
        notificationService.sendNotification(message);
        log.info("교환 거절 알림 생성 완료 - recipientId: {}, swapId: {}", recipientId, swapId);
    }
} 