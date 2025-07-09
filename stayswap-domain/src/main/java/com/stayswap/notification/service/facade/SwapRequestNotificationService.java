package com.stayswap.notification.service.facade;

import com.stayswap.notification.service.domain.booking.BookingNotificationService;
import com.stayswap.notification.service.domain.swap.SwapNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 교환/숙박 요청 알림 서비스 퍼사드
 * 알림 처리 로직을 적절한 서비스로 위임
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SwapRequestNotificationService {

    private final BookingNotificationService bookingNotificationService;
    private final SwapNotificationService swapNotificationService;

    /**
     * 숙박 요청 알림 생성
     */
    public void createBookingRequestNotification(Long recipientId, Long senderId, Long bookingId) {
        bookingNotificationService.createBookingRequestNotification(recipientId, senderId, bookingId);
    }

    /**
     * 교환 요청 알림 생성
     */
    public void createSwapRequestNotification(Long recipientId, Long senderId, Long swapId) {
        swapNotificationService.createSwapRequestNotification(recipientId, senderId, swapId);
    }
    
    /**
     * 숙박 요청 승인 알림 생성
     */
    public void createBookingAcceptedNotification(Long recipientId, Long senderId, Long bookingId) {
        bookingNotificationService.createBookingAcceptedNotification(recipientId, senderId, bookingId);
    }
    
    /**
     * 교환 요청 승인 알림 생성
     */
    public void createSwapAcceptedNotification(Long recipientId, Long senderId, Long swapId) {
        swapNotificationService.createSwapAcceptedNotification(recipientId, senderId, swapId);
    }
    
    /**
     * 숙박 요청 거절 알림 생성
     */
    public void createBookingRejectedNotification(Long recipientId, Long senderId, Long bookingId) {
        bookingNotificationService.createBookingRejectedNotification(recipientId, senderId, bookingId);
    }
    
    /**
     * 교환 요청 거절 알림 생성
     */
    public void createSwapRejectedNotification(Long recipientId, Long senderId, Long swapId) {
        swapNotificationService.createSwapRejectedNotification(recipientId, senderId, swapId);
    }
    
    /**
     * 숙박 요청 만료 알림 생성 (게스트에게만)
     */
    public void createBookingExpiredNotification(Long recipientId, Long hostId, Long bookingId) {
        bookingNotificationService.createBookingExpiredNotification(recipientId, hostId, bookingId);
    }
    
    /**
     * 교환 요청 만료 알림 생성 (게스트에게만)
     */
    public void createSwapExpiredNotification(Long recipientId, Long hostId, Long swapId) {
        swapNotificationService.createSwapExpiredNotification(recipientId, hostId, swapId);
    }
} 