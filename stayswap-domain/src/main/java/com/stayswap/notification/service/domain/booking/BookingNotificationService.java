package com.stayswap.notification.service.domain.booking;

import com.stayswap.notification.constant.NotificationType;
import com.stayswap.notification.dto.request.NotificationMessage;
import com.stayswap.notification.producer.NotificationPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 숙박 요청 알림 서비스
 * 숙박 요청과 관련된 알림 처리를 담당
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class BookingNotificationService {

    private final NotificationPublisher notificationPublisher;

    /**
     * 숙박 요청 알림 생성
     */
    public void createBookingRequestNotification(Long recipientId, Long senderId, Long bookingId) {
        NotificationMessage message = NotificationMessage.builder()
                .recipientId(recipientId)
                .senderId(senderId)
                .type(NotificationType.BOOKING_REQUEST)
                .title("[숙박 요청]")
                .content("새로운 숙박 요청이 도착했습니다. 지금 바로 확인해보세요!")
                .referenceId(bookingId)
                .build();
        
        notificationPublisher.sendNotification(message);
        log.info("숙박 요청 알림 생성 완료 - recipientId: {}, bookingId: {}", recipientId, bookingId);
    }
    
    /**
     * 숙박 요청 승인 알림 생성
     */
    public void createBookingAcceptedNotification(Long recipientId, Long senderId, Long bookingId) {
        NotificationMessage message = NotificationMessage.builder()
                .recipientId(recipientId)
                .senderId(senderId)
                .type(NotificationType.BOOKING_ACCEPTED)
                .title("[숙박 요청 승인]")
                .content("요청하신 숙박이 승인되었습니다. 일정을 확인해보세요!")
                .referenceId(bookingId)
                .build();
        
        notificationPublisher.sendNotification(message);
        log.info("숙박 승인 알림 생성 완료 - recipientId: {}, bookingId: {}", recipientId, bookingId);
    }
    
    /**
     * 숙박 요청 거절 알림 생성
     */
    public void createBookingRejectedNotification(Long recipientId, Long senderId, Long bookingId) {
        NotificationMessage message = NotificationMessage.builder()
                .recipientId(recipientId)
                .senderId(senderId)
                .type(NotificationType.BOOKING_REJECTED)
                .title("[숙박 요청 거절]")
                .content("아쉽게도 요청하신 숙박이 호스트의 사정으로 수락되지 않았습니다. 다른 멋진 숙소들을 찾아보세요. 스테이스왑이 도와드릴게요!")
                .referenceId(bookingId)
                .build();
        
        notificationPublisher.sendNotification(message);
        log.info("숙박 거절 알림 생성 완료 - recipientId: {}, bookingId: {}", recipientId, bookingId);
    }
    
    /**
     * 숙박 요청 만료 알림 생성 (게스트에게만)
     */
    public void createBookingExpiredNotification(Long recipientId, Long hostId, Long bookingId) {
        NotificationMessage message = NotificationMessage.builder()
                .recipientId(recipientId)
                .senderId(hostId)
                .type(NotificationType.BOOKING_EXPIRED)
                .title("[숙박 요청 안내]")
                .content("호스트님께서 일정 기간 동안 응답을 하지 않아 숙박 요청이 자동으로 만료되었어요 😢\n새로운 숙소를 찾아보는 건 어떨까요? ✨")
                // todo: 근처 위치의 숙소 추천해주기
                .referenceId(bookingId)
                .build();
        
        notificationPublisher.sendNotification(message);
        log.info("숙박 만료 알림 생성 완료 - recipientId: {}, hostId: {}, bookingId: {}", recipientId, hostId, bookingId);
    }
} 