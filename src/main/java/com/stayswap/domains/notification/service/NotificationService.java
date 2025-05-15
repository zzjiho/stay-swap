package com.stayswap.domains.notification.service;

import com.stayswap.domains.notification.constant.NotificationType;
import com.stayswap.domains.notification.model.dto.request.NotificationMessage;
import com.stayswap.domains.notification.model.dto.response.NotificationResponse;
import com.stayswap.domains.notification.model.entity.Notification;
import com.stayswap.domains.notification.repository.NotificationRepository;
import com.stayswap.domains.swap.constant.SwapStatus;
import com.stayswap.domains.swap.constant.SwapType;
import com.stayswap.domains.swap.model.entity.Swap;
import com.stayswap.domains.swap.repository.SwapRepository;
import com.stayswap.domains.user.model.entity.User;
import com.stayswap.domains.user.repository.UserRepository;
import com.stayswap.global.config.RabbitMQConfig;
import com.stayswap.global.error.exception.AuthenticationException;
import com.stayswap.global.error.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static com.stayswap.global.code.ErrorCode.*;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SwapRepository swapRepository;
    private final RabbitTemplate rabbitTemplate;
    private final FCMService fcmService;

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
                .title("체크인 안내")
                .content("오늘은 체크인 날입니다. 호스트가 기다리고 있어요.")
                .referenceId(swapId)
                .build();
        
        sendNotification(message);
    }
    
    /**
     * 숙소 주인에게 체크인 알림 전송
     */
    private void sendCheckinNotificationToHost(Long hostId, Long requesterId, Long swapId) {
        NotificationMessage message = NotificationMessage.builder()
                .recipientId(hostId)
                .senderId(requesterId)
                .type(NotificationType.CHECK_IN)
                .title("게스트 도착 안내")
                .content("오늘은 게스트가 도착하는 날입니다. 환영 준비는 완료되셨나요?")
                .referenceId(swapId)
                .build();
        
        sendNotification(message);
    }
    
    /**
     * 교환 참여자에게 체크인 알림 전송 (양쪽 동일 메시지)
     */
    private void sendCheckinNotificationToSwapParticipant(Long recipientId, Long senderId, Long swapId) {
        NotificationMessage message = NotificationMessage.builder()
                .recipientId(recipientId)
                .senderId(senderId)
                .type(NotificationType.CHECK_IN)
                .title("숙소 교환 체크인")
                .content("오늘은 숙소 교환 체크인 날입니다. 즐거운 여행 되세요.")
                .referenceId(swapId)
                .build();
        
        sendNotification(message);
    }
    
    /**
     * 숙박 신청자에게 체크아웃 알림 전송
     */
    private void sendCheckoutNotificationToRequester(Long requesterId, Long hostId, Long swapId) {
        NotificationMessage message = NotificationMessage.builder()
                .recipientId(requesterId)
                .senderId(hostId)
                .type(NotificationType.CHECK_OUT)
                .title("체크아웃 안내")
                .content("오늘은 체크아웃 날입니다. 이용해 주셔서 감사합니다.")
                .referenceId(swapId)
                .build();
        
        sendNotification(message);
    }
    
    /**
     * 숙소 주인에게 체크아웃 알림 전송
     */
    private void sendCheckoutNotificationToHost(Long hostId, Long requesterId, Long swapId) {
        NotificationMessage message = NotificationMessage.builder()
                .recipientId(hostId)
                .senderId(requesterId)
                .type(NotificationType.CHECK_OUT)
                .title("게스트 체크아웃 안내")
                .content("오늘은 게스트 체크아웃 날입니다. 좋은 만남이 되셨나요?")
                .referenceId(swapId)
                .build();
        
        sendNotification(message);
    }
    
    /**
     * 교환 참여자에게 체크아웃 알림 전송 (양쪽 동일 메시지)
     */
    private void sendCheckoutNotificationToSwapParticipant(Long recipientId, Long senderId, Long swapId) {
        NotificationMessage message = NotificationMessage.builder()
                .recipientId(recipientId)
                .senderId(senderId)
                .type(NotificationType.CHECK_OUT)
                .title("숙소 교환 체크아웃")
                .content("오늘은 숙소 교환 체크아웃 날입니다. 즐거운 시간 되셨나요?")
                .referenceId(swapId)
                .build();
        
        sendNotification(message);
    }

    /**
     * 알림 메시지를 RabbitMQ로 전송
     */
    public void sendNotification(NotificationMessage message) {

        rabbitTemplate.convertAndSend(
                RabbitMQConfig.NOTIFICATION_EXCHANGE,
                RabbitMQConfig.NOTIFICATION_ROUTING_KEY, message
        );
        log.info("알림 메시지 전송 완료: {}", message);
    }

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
        
        sendNotification(message);
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
        
        sendNotification(message);
    }

    /**
     * 알림 저장 및 FCM 발송 처리 (RabbitMQ 컨슈머에서 호출)
     */
    public void processNotification(NotificationMessage message) {
        Notification notification = saveNotification(message);
        
        // FCM 푸시 알림 전송 (사용자의 모든 기기에)
        fcmService.sendPushNotificationToUser(
                notification.getRecipient().getId(),
                notification.getTitle(),
                notification.getContent(),
                notification.getType(),
                notification.getReferenceId()
        );
    }

    /**
     * 알림 저장
     */
    private Notification saveNotification(NotificationMessage message) {

        User recipient = userRepository.findById(message.getRecipientId())
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));
        
        User sender = userRepository.findById(message.getSenderId())
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));
        
        Notification notification = Notification.builder()
                .recipient(recipient)
                .sender(sender)
                .type(message.getType())
                .title(message.getTitle())
                .content(message.getContent())
                .referenceId(message.getReferenceId())
                .build();
        
        return notificationRepository.save(notification);
    }

    /**
     * 사용자의 알림 목록 조회
     */
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(Long userId, Pageable pageable) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));
        
        return notificationRepository.findByRecipientOrderByRegTimeDesc(user, pageable)
                .map(NotificationResponse::from);
    }

    /**
     * 알림 읽음 처리
     */
    public NotificationResponse markAsRead(Long notificationId, Long userId) {

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_RESOURCE));
        
        if (!notification.getRecipient().getId().equals(userId)) {
            throw new AuthenticationException(NOT_AUTHORIZED);
        }
        
        notification.markAsRead();
        
        return NotificationResponse.from(notification);
    }

    /**
     * 읽지 않은 알림 개수 조회
     */
    @Transactional(readOnly = true)
    public long countUnreadNotifications(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));
        
        return notificationRepository.countByRecipientAndIsRead(user, false);
    }

    /**
     * 테스트 알림 생성 (사용자 자신에게 발송)
     */
    public void createTestNotification(Long userId, String title, String content) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));

        NotificationMessage message = NotificationMessage.builder()
                .recipientId(userId)
                .senderId(userId) // 자신에게 보내는 알림이므로 발신자도 동일
                .type(NotificationType.TEST_NOTIFICATION)
                .title(title != null ? title : "테스트 알림입니다")
                .content(content != null ? content : "이것은 테스트 알림입니다.")
                .referenceId(0L) // 테스트 알림이므로 참조 ID는 0으로 설정
                .build();
        
        sendNotification(message);
    }
} 