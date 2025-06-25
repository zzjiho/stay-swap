package com.stayswap.notification.service.reader;

import com.stayswap.notification.document.Notification;
import com.stayswap.notification.document.TestNotification;
import com.stayswap.notification.repository.NotificationMongoRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Set;

import static com.stayswap.notification.constant.NotificationType.TEST_NOTIFICATION;
import static java.time.temporal.ChronoUnit.DAYS;
import static java.time.temporal.ChronoUnit.HOURS;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.never;

@ExtendWith(MockitoExtension.class)
@DisplayName("새 알림 여부 확인 서비스")
class CheckNewNotificationServiceTest {

    @Mock
    private NotificationMongoRepository notificationMongoRepository;

    @Mock
    private IndividualNotificationReadService individualNotificationReadService;

    @InjectMocks
    private CheckNewNotificationService checkNewNotificationService;

    private final Long validUserId = 123L;
    private final Instant now = Instant.now();
    private final Instant twoHoursAgo = now.minus(2, HOURS);
    private final Instant oneDayAgo = now.minus(1, DAYS);
    private final Instant twoDaysAgo = now.minus(2, DAYS);

    @Nested
    @DisplayName("개별 읽음 상태 기반 테스트")
    class IndividualReadStatusTest {

        @Test
        @DisplayName("새 알림 있음: 읽지 않은 알림이 하나라도 있으면 새 알림이 있다고 판단")
        void hasNewNotificationWhenUnreadNotificationExists() {
            // Given
            List<Notification> notifications = List.of(
                createMockNotification("read1", now, twoHoursAgo),
                createMockNotification("unread1", now, oneDayAgo),  // 이 알림은 안 읽음
                createMockNotification("read2", now, twoDaysAgo)
            );
            
            given(notificationMongoRepository.findTop100ByRecipientIdOrderByOccurredAtDesc(validUserId))
                .willReturn(notifications);
            given(individualNotificationReadService.getReadNotificationIds(validUserId))
                .willReturn(Set.of("read1", "read2")); // unread1은 읽지 않음

            // When
            boolean hasNewNotification = checkNewNotificationService.checkNewNotification(validUserId);

            // Then
            assertTrue(hasNewNotification);
            then(notificationMongoRepository).should().findTop100ByRecipientIdOrderByOccurredAtDesc(validUserId);
            then(individualNotificationReadService).should().getReadNotificationIds(validUserId);
        }

        @Test
        @DisplayName("새 알림 없음: 모든 알림이 읽음 상태면 새 알림이 없다고 판단")
        void noNewNotificationWhenAllNotificationsAreRead() {
            // Given
            List<Notification> notifications = List.of(
                createMockNotification("read1", now, twoHoursAgo),
                createMockNotification("read2", now, oneDayAgo),
                createMockNotification("read3", now, twoDaysAgo)
            );
            
            given(notificationMongoRepository.findTop100ByRecipientIdOrderByOccurredAtDesc(validUserId))
                .willReturn(notifications);
            given(individualNotificationReadService.getReadNotificationIds(validUserId))
                .willReturn(Set.of("read1", "read2", "read3")); // 모든 알림 읽음

            // When
            boolean hasNewNotification = checkNewNotificationService.checkNewNotification(validUserId);

            // Then
            assertFalse(hasNewNotification);
        }
    }

    @Nested
    @DisplayName("엣지 케이스 테스트")
    class EdgeCaseTest {

        @Test
        @DisplayName("알림 없는 사용자: 알림이 하나도 없으면 새 알림 없음")
        void noNewNotificationForUserWithoutAnyNotifications() {
            // Given
            given(notificationMongoRepository.findTop100ByRecipientIdOrderByOccurredAtDesc(validUserId))
                .willReturn(List.of());

            // When
            boolean hasNewNotification = checkNewNotificationService.checkNewNotification(validUserId);

            // Then
            assertFalse(hasNewNotification);
            then(individualNotificationReadService).should(never()).getReadNotificationIds(validUserId);
        }

        @Test
        @DisplayName("첫 방문 사용자: 읽음 상태 정보가 없고 알림이 있으면 새 알림 있음")
        void hasNewNotificationForFirstTimeUser() {
            // Given
            List<Notification> notifications = List.of(
                createMockNotification("new1", now, twoHoursAgo)
            );
            
            given(notificationMongoRepository.findTop100ByRecipientIdOrderByOccurredAtDesc(validUserId))
                .willReturn(notifications);
            given(individualNotificationReadService.getReadNotificationIds(validUserId))
                .willReturn(Set.of()); // 읽은 알림 없음

            // When
            boolean hasNewNotification = checkNewNotificationService.checkNewNotification(validUserId);

            // Then
            assertTrue(hasNewNotification);
        }

        @Test
        @DisplayName("부분 읽음: 여러 알림 중 일부만 읽은 경우")
        void hasNewNotificationWithPartiallyRead() {
            // Given
            List<Notification> notifications = List.of(
                createMockNotification("read1", now, twoHoursAgo),    // 읽음
                createMockNotification("unread1", now, oneDayAgo),    // 안 읽음
                createMockNotification("read2", now, twoDaysAgo),     // 읽음
                createMockNotification("unread2", now, twoDaysAgo)    // 안 읽음
            );
            
            given(notificationMongoRepository.findTop100ByRecipientIdOrderByOccurredAtDesc(validUserId))
                .willReturn(notifications);
            given(individualNotificationReadService.getReadNotificationIds(validUserId))
                .willReturn(Set.of("read1", "read2")); // 일부만 읽음

            // When
            boolean hasNewNotification = checkNewNotificationService.checkNewNotification(validUserId);

            // Then
            assertTrue(hasNewNotification); // unread1, unread2 때문에 새 알림 있음
        }
    }

    private Notification createMockNotification(String id, Instant createdAt, Instant occurredAt) {
        return TestNotification.builder()
                .id(id)
                .recipientId(validUserId)
                .senderId(456L)
                .referenceId(789L)
                .title("테스트 알림")
                .content("테스트 알림 내용")
                .type(TEST_NOTIFICATION)
                .isRead(false)
                .occurredAt(occurredAt)
                .createdAt(createdAt)
                .lastUpdatedAt(createdAt)
                .build();
    }
}