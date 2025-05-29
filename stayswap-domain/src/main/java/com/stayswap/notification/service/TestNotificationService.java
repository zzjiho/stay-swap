package com.stayswap.notification.service;

import com.stayswap.notification.constant.NotificationType;
import com.stayswap.notification.model.dto.request.NotificationMessage;
import com.stayswap.user.repository.UserRepository;
import com.stayswap.error.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.stayswap.code.ErrorCode.NOT_EXISTS_USER;

/**
 * 테스트 알림 서비스
 * 테스트 목적의 알림 기능을 담당
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TestNotificationService {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    /**
     * 테스트 알림 생성 (사용자 자신에게 발송)
     */
    public void createTestNotification(Long userId, String title, String content) {
        if (!userRepository.existsById(userId)) {
            throw new NotFoundException(NOT_EXISTS_USER);
        }

        NotificationMessage message = NotificationMessage.builder()
                .recipientId(userId)
                .senderId(userId) // 자신에게 보내는 알림이므로 발신자도 동일
                .type(NotificationType.TEST_NOTIFICATION)
                .title(title != null ? title : "테스트 알림입니다")
                .content(content != null ? content : "이것은 테스트 알림입니다.")
                .referenceId(0L) // 테스트 알림이므로 참조 ID는 0으로 설정
                .build();
        
        notificationService.sendNotification(message);
        log.info("테스트 알림 생성 완료 - userId: {}", userId);
    }
} 