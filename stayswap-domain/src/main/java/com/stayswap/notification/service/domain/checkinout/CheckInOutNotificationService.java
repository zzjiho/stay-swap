package com.stayswap.notification.service.domain.checkinout;

import com.stayswap.notification.constant.NotificationType;
import com.stayswap.notification.dto.request.NotificationMessage;
import com.stayswap.notification.producer.NotificationPublisher;
import com.stayswap.swap.constant.SwapStatus;
import com.stayswap.swap.constant.SwapType;
import com.stayswap.swap.model.entity.Swap;
import com.stayswap.swap.repository.SwapRepository;
import com.stayswap.user.model.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * 체크인/체크아웃 알림 서비스
 * 숙소 체크인 및 체크아웃 관련 알림 처리를 담당
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CheckInOutNotificationService {

    private final NotificationPublisher notificationPublisher;
    private final SwapRepository swapRepository;

    /**
     * 체크인 알림 생성 (오전 9시 스케줄러에서 실행)
     * 당일 체크인 예정인 숙소에 대해 알림 발송
     */
    public void createCheckinNotification() {
        LocalDate today = LocalDate.now();
        log.info("체크인 알림 생성 시작 - 날짜: {}", today);
        
        // 오늘이 체크인 날짜(startDate)이고, ACCEPTED 상태인 예약 조회
        List<Swap> todayCheckInSwaps = findTodayCheckInSwaps(today);
        
        if (todayCheckInSwaps.isEmpty()) {
            log.info("오늘 체크인 예정인 숙소가 없습니다.");
            return;
        }
        
        log.info("체크인 알림 대상 숙소 수: {}", todayCheckInSwaps.size());
        
        for (Swap swap : todayCheckInSwaps) {
            try {
                sendCheckinNotifications(swap);
            } catch (Exception e) {
                log.error("체크인 알림 발송 중 오류 발생 - swapId: {}, error: {}", swap.getId(), e.getMessage(), e);
            }
        }
        
        log.info("체크인 알림 생성 완료");
    }
    
    /**
     * 체크아웃 알림 생성 (오전 9시 스케줄러에서 실행)
     * 당일 체크아웃 예정인 숙소에 대해 알림 발송
     */
    public void createCheckoutNotification() {
        LocalDate today = LocalDate.now();
        log.info("체크아웃 알림 생성 시작 - 날짜: {}", today);
        
        // 오늘이 체크아웃 날짜(endDate)이고, ACCEPTED 상태인 예약 조회
        List<Swap> todayCheckOutSwaps = findTodayCheckOutSwaps(today);
        
        if (todayCheckOutSwaps.isEmpty()) {
            log.info("오늘 체크아웃 예정인 숙소가 없습니다.");
            return;
        }
        
        log.info("체크아웃 알림 대상 숙소 수: {}", todayCheckOutSwaps.size());
        
        for (Swap swap : todayCheckOutSwaps) {
            try {
                sendCheckoutNotifications(swap);
            } catch (Exception e) {
                log.error("체크아웃 알림 발송 중 오류 발생 - swapId: {}, error: {}", swap.getId(), e.getMessage(), e);
            }
        }
        
        log.info("체크아웃 알림 생성 완료");
    }
    
    /**
     * 오늘이 체크인 날짜인 ACCEPTED 상태의 예약 조회
     */
    private List<Swap> findTodayCheckInSwaps(LocalDate today) {
        return swapRepository.findAll().stream()
                .filter(swap -> 
                    swap.getSwapStatus() == SwapStatus.ACCEPTED && 
                    swap.getStartDate().equals(today))
                .toList();
    }
    
    /**
     * 오늘이 체크아웃 날짜인 ACCEPTED 상태의 예약 조회
     */
    private List<Swap> findTodayCheckOutSwaps(LocalDate today) {
        return swapRepository.findAll().stream()
                .filter(swap -> 
                    swap.getSwapStatus() == SwapStatus.ACCEPTED && 
                    swap.getEndDate().equals(today))
                .toList();
    }
    
    /**
     * 예약 유형에 따라 체크인 알림 발송
     */
    private void sendCheckinNotifications(Swap swap) {
        User requester = swap.getRequester();
        User host = swap.getHouse().getUser();
        
        if (swap.getSwapType() == SwapType.STAY) {
            // 숙박 요청인 경우: 신청자와 숙소 주인에게 다른 메시지 전송
            sendCheckinNotificationToRequester(requester.getId(), host.getId(), swap.getId());
            sendCheckinNotificationToHost(host.getId(), requester.getId(), swap.getId());
        } else if (swap.getSwapType() == SwapType.SWAP) {
            // 교환 요청인 경우: 양쪽 모두 동일한 메시지 전송
            sendCheckinNotificationToSwapParticipant(requester.getId(), host.getId(), swap.getId());
            sendCheckinNotificationToSwapParticipant(host.getId(), requester.getId(), swap.getId());
        }
    }
    
    /**
     * 예약 유형에 따라 체크아웃 알림 발송
     */
    private void sendCheckoutNotifications(Swap swap) {
        User requester = swap.getRequester();
        User host = swap.getHouse().getUser();
        
        if (swap.getSwapType() == SwapType.STAY) {
            // 숙박 요청인 경우: 신청자와 숙소 주인에게 다른 메시지 전송
            sendCheckoutNotificationToRequester(requester.getId(), host.getId(), swap.getId());
            sendCheckoutNotificationToHost(host.getId(), requester.getId(), swap.getId());
        } else if (swap.getSwapType() == SwapType.SWAP) {
            // 교환 요청인 경우: 양쪽 모두 동일한 메시지 전송
            sendCheckoutNotificationToSwapParticipant(requester.getId(), host.getId(), swap.getId());
            sendCheckoutNotificationToSwapParticipant(host.getId(), requester.getId(), swap.getId());
        }
    }
    
    /**
     * 숙박 신청자에게 체크인 알림 전송
     */
    private void sendCheckinNotificationToRequester(Long requesterId, Long hostId, Long swapId) {
        NotificationMessage message = NotificationMessage.builder()
                .recipientId(requesterId)
                .senderId(hostId)
                .type(NotificationType.CHECK_IN)
                .title("[체크인 안내]")
                .content("오늘은 체크인 날입니다. 호스트가 기다리고 있어요!")
                .referenceId(swapId)
                .build();
        
        notificationPublisher.sendNotification(message);
    }
    
    /**
     * 숙소 주인에게 체크인 알림 전송
     */
    private void sendCheckinNotificationToHost(Long hostId, Long requesterId, Long swapId) {
        NotificationMessage message = NotificationMessage.builder()
                .recipientId(hostId)
                .senderId(requesterId)
                .type(NotificationType.CHECK_IN)
                .title("[게스트 도착 안내]")
                .content("오늘은 게스트가 도착하는 날입니다. 환영 준비는 완료되셨나요?")
                .referenceId(swapId)
                .build();
        
        notificationPublisher.sendNotification(message);
    }
    
    /**
     * 교환 참여자에게 체크인 알림 전송 (양쪽 동일 메시지)
     */
    private void sendCheckinNotificationToSwapParticipant(Long recipientId, Long senderId, Long swapId) {
        NotificationMessage message = NotificationMessage.builder()
                .recipientId(recipientId)
                .senderId(senderId)
                .type(NotificationType.CHECK_IN)
                .title("[숙소 교환 체크인]")
                .content("오늘은 숙소 교환 체크인 날입니다. 즐거운 여행 되세요!")
                .referenceId(swapId)
                .build();
        
        notificationPublisher.sendNotification(message);
    }
    
    /**
     * 숙박 신청자에게 체크아웃 알림 전송
     */
    private void sendCheckoutNotificationToRequester(Long requesterId, Long hostId, Long swapId) {
        NotificationMessage message = NotificationMessage.builder()
                .recipientId(requesterId)
                .senderId(hostId)
                .type(NotificationType.CHECK_OUT)
                .title("[체크아웃 안내]")
                .content("오늘은 체크아웃 날입니다. 이용해 주셔서 감사합니다!")
                .referenceId(swapId)
                .build();
        
        notificationPublisher.sendNotification(message);
    }
    
    /**
     * 숙소 주인에게 체크아웃 알림 전송
     */
    private void sendCheckoutNotificationToHost(Long hostId, Long requesterId, Long swapId) {
        NotificationMessage message = NotificationMessage.builder()
                .recipientId(hostId)
                .senderId(requesterId)
                .type(NotificationType.CHECK_OUT)
                .title("[게스트 체크아웃 안내]")
                .content("오늘은 게스트 체크아웃 날입니다. 좋은 만남이 되셨나요?")
                .referenceId(swapId)
                .build();
        
        notificationPublisher.sendNotification(message);
    }
    
    /**
     * 교환 참여자에게 체크아웃 알림 전송 (양쪽 동일 메시지)
     */
    private void sendCheckoutNotificationToSwapParticipant(Long recipientId, Long senderId, Long swapId) {
        NotificationMessage message = NotificationMessage.builder()
                .recipientId(recipientId)
                .senderId(senderId)
                .type(NotificationType.CHECK_OUT)
                .title("[숙소 교환 체크아웃]")
                .content("오늘은 숙소 교환 체크아웃 날입니다. 즐거운 시간 되셨나요?")
                .referenceId(swapId)
                .build();
        
        notificationPublisher.sendNotification(message);
    }
} 