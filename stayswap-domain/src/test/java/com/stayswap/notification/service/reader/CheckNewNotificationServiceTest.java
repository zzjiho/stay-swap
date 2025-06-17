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
import java.util.Optional;

import static com.stayswap.notification.constant.NotificationType.TEST_NOTIFICATION;
import static java.time.temporal.ChronoUnit.DAYS;
import static java.time.temporal.ChronoUnit.HOURS;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;

@ExtendWith(MockitoExtension.class)
@DisplayName("새 알림 여부 확인 서비스")
class CheckNewNotificationServiceTest {

    @Mock
    private NotificationMongoRepository notificationMongoRepository;

    @Mock
    private LastReadAtService lastReadAtService;

    @InjectMocks
    private CheckNewNotificationService checkNewNotificationService;

    private final Long validUserId = 123L;
    private final Instant now = Instant.now();
    private final Instant twoHoursAgo = now.minus(2, HOURS);
    private final Instant oneDayAgo = now.minus(1, DAYS);
    private final Instant twoDaysAgo = now.minus(2, DAYS);

    @Nested
    @DisplayName("새 알림 여부 확인 로직 테스트 - MongoDB 최신 알림과 Redis 마지막 읽은 시간 비교")
    class NewNotificationCheckTest {

        @Test
        @DisplayName("새 알림 있음: 최신 알림 시간(2시간 전)이 마지막 읽은 시간(1일 전)보다 늦으면 새 알림이 있다고 판단")
        void hasNewNotificationWhenLatestUpdateIsAfterLastReadTime() {

            // Given
            Notification latestNotification = createMockNotification("latest", now, twoHoursAgo); // 2시간 전 업데이트

            // note: write around 패턴이므로 성능 최적화를 위해 먼저 조회
            given(notificationMongoRepository.findFirstByRecipientIdOrderByLastUpdatedAtDesc(validUserId))
                    .willReturn(Optional.of(latestNotification));
            given(lastReadAtService.getLastReadAt(validUserId))
                    .willReturn(oneDayAgo); // 1일 전에 마지막 읽음

            // When
            boolean hasNewNotification = checkNewNotificationService.checkNewNotification(validUserId);

            // Then
            assertTrue(hasNewNotification);
            then(notificationMongoRepository).should().findFirstByRecipientIdOrderByLastUpdatedAtDesc(validUserId);
            then(lastReadAtService).should().getLastReadAt(validUserId);
        }

        @Test
        @DisplayName("새 알림 없음: 최신 알림 시간(2일 전)이 마지막 읽은 시간(2시간 전)보다 이르면 새 알림이 없다고 판단")
        void noNewNotificationWhenLatestUpdateIsBeforeLastReadTime() {

            // Given
            Notification oldNotification = createMockNotification("old", now, twoDaysAgo); // 2일 전 업데이트
            given(notificationMongoRepository.findFirstByRecipientIdOrderByLastUpdatedAtDesc(validUserId))
                    .willReturn(Optional.of(oldNotification));
            given(lastReadAtService.getLastReadAt(validUserId))
                    .willReturn(twoHoursAgo); // 2시간 전에 마지막 읽음

            // When
            boolean hasNewNotification = checkNewNotificationService.checkNewNotification(validUserId);

            // Then
            assertFalse(hasNewNotification);
            then(notificationMongoRepository).should().findFirstByRecipientIdOrderByLastUpdatedAtDesc(validUserId);
            then(lastReadAtService).should().getLastReadAt(validUserId);
        }

        @Test
        @DisplayName("동일 시간: 최신 알림 시간과 마지막 읽은 시간이 정확히 같으면 새 알림이 없다고 판단")
        void noNewNotificationWhenLatestUpdateEqualsLastReadTime() {

            // Given
            Instant sameTime = now.minus(1, HOURS);
            Notification sameTimeNotification = createMockNotification("same", now, sameTime);
            given(notificationMongoRepository.findFirstByRecipientIdOrderByLastUpdatedAtDesc(validUserId))
                    .willReturn(Optional.of(sameTimeNotification));
            given(lastReadAtService.getLastReadAt(validUserId))
                    .willReturn(sameTime); // 같은 시간에 마지막 읽음

            // When
            boolean hasNewNotification = checkNewNotificationService.checkNewNotification(validUserId);

            // Then
            assertFalse(hasNewNotification);
            then(notificationMongoRepository).should().findFirstByRecipientIdOrderByLastUpdatedAtDesc(validUserId);
            then(lastReadAtService).should().getLastReadAt(validUserId);
        }
    }

    @Nested
    @DisplayName("마지막 읽은 시간이 없는 경우 테스트 - 첫 방문 사용자 또는 Redis 데이터 없음")
    class NoLastReadTimeTest {

        @Test
        @DisplayName("첫 방문 사용자: 마지막 읽은 시간이 null이고 알림이 있으면 새 알림이 있다고 판단")
        void hasNewNotificationForFirstTimeUserWithNotifications() {

            // Given
            Notification latestNotification = createMockNotification("latest", now, twoHoursAgo);
            given(notificationMongoRepository.findFirstByRecipientIdOrderByLastUpdatedAtDesc(validUserId))
                    .willReturn(Optional.of(latestNotification));
            given(lastReadAtService.getLastReadAt(validUserId))
                    .willReturn(null); // Redis에 읽은 시간 정보 없음

            // When
            boolean hasNewNotification = checkNewNotificationService.checkNewNotification(validUserId);

            // Then
            assertTrue(hasNewNotification);
            then(notificationMongoRepository).should().findFirstByRecipientIdOrderByLastUpdatedAtDesc(validUserId);
            then(lastReadAtService).should().getLastReadAt(validUserId);
        }

        @Test
        @DisplayName("Redis 데이터 없음: 마지막 읽은 시간이 null이지만 알림도 없으면 새 알림이 없다고 판단")
        void noNewNotificationForUserWithoutLastReadTimeAndNoNotifications() {

            // Given
            given(notificationMongoRepository.findFirstByRecipientIdOrderByLastUpdatedAtDesc(validUserId))
                    .willReturn(Optional.empty());

            // When
            boolean hasNewNotification = checkNewNotificationService.checkNewNotification(validUserId);

            // Then
            assertFalse(hasNewNotification);
            then(notificationMongoRepository).should().findFirstByRecipientIdOrderByLastUpdatedAtDesc(validUserId);
            then(lastReadAtService).shouldHaveNoInteractions();
        }
    }

    @Nested
    @DisplayName("알림이 없는 경우 테스트 - MongoDB에 사용자 알림 데이터 없음")
    class NoNotificationsTest {

        @Test
        @DisplayName("알림 없는 사용자: MongoDB에 알림이 하나도 없으면 새 알림이 없다고 판단하고 Redis 조회도 하지 않음")
        void noNewNotificationWhenUserHasNoNotifications() {

            // Given
            given(notificationMongoRepository.findFirstByRecipientIdOrderByLastUpdatedAtDesc(validUserId))
                    .willReturn(Optional.empty());

            // When
            boolean hasNewNotification = checkNewNotificationService.checkNewNotification(validUserId);

            // Then
            assertFalse(hasNewNotification);
            then(notificationMongoRepository).should().findFirstByRecipientIdOrderByLastUpdatedAtDesc(validUserId);
            then(lastReadAtService).shouldHaveNoInteractions();
        }

        @Test
        @DisplayName("성능 최적화 확인: 알림이 없으면 불필요한 Redis 조회를 하지 않아 성능을 절약한다 (Redis 서비스 호출되지 않음을 명시적으로 검증)")
        void optimizationBySkippingRedisWhenNoNotifications() {

            // Given
            given(notificationMongoRepository.findFirstByRecipientIdOrderByLastUpdatedAtDesc(validUserId))
                    .willReturn(Optional.empty());

            // When
            checkNewNotificationService.checkNewNotification(validUserId);

            // Then
            then(lastReadAtService).shouldHaveNoInteractions();
        }
    }

    @Nested
    @DisplayName("getLatestUpdatedAt 메서드 테스트 - MongoDB에서 최신 알림 시간 조회")
    class GetLatestUpdatedAtTest {

        @Test
        @DisplayName("최신 알림 시간 반환: MongoDB에 알림이 있으면 가장 최근 업데이트된 알림의 lastUpdatedAt을 반환")
        void returnsLatestUpdatedAtWhenNotificationExists() {

            // Given
            Instant expectedTime = twoHoursAgo;
            Notification latestNotification = createMockNotification("latest", now, expectedTime);
            given(notificationMongoRepository.findFirstByRecipientIdOrderByLastUpdatedAtDesc(validUserId))
                    .willReturn(Optional.of(latestNotification));

            // When
            boolean result = checkNewNotificationService.checkNewNotification(validUserId);

            // Then
            then(notificationMongoRepository).should().findFirstByRecipientIdOrderByLastUpdatedAtDesc(validUserId);
        }

        @Test
        @DisplayName("null 반환: MongoDB에 알림이 없으면 null을 반환하고 새 알림 없음으로 판단")
        void returnsNullWhenNoNotificationExists() {

            // Given
            given(notificationMongoRepository.findFirstByRecipientIdOrderByLastUpdatedAtDesc(validUserId))
                    .willReturn(Optional.empty());

            // When
            boolean hasNewNotification = checkNewNotificationService.checkNewNotification(validUserId);

            // Then
            assertFalse(hasNewNotification);
            then(notificationMongoRepository).should().findFirstByRecipientIdOrderByLastUpdatedAtDesc(validUserId);
        }
    }

    @Nested
    @DisplayName("실제 앱에서 발생할 수 있는 상황들을 테스트한다")
    class RealWorldScenarioTest {

        @Test
        @DisplayName("사용자가 오랜만에 앱을 열었을 때 - 마지막 읽은 시간보다 훨씬 최근에 여러 알림이 도착한 상황")
        void userOpensAppAfterLongTime() {

            // Given - 사용자가 3일 전에 마지막으로 읽음, 1시간 전에 새 알림 도착
            Instant threeDaysAgo = now.minus(3, DAYS);
            Instant oneHourAgo = now.minus(1, HOURS);

            Notification recentNotification = createMockNotification("recent", now, oneHourAgo);
            given(notificationMongoRepository.findFirstByRecipientIdOrderByLastUpdatedAtDesc(validUserId))
                    .willReturn(Optional.of(recentNotification));
            given(lastReadAtService.getLastReadAt(validUserId))
                    .willReturn(threeDaysAgo);

            // When
            boolean hasNewNotification = checkNewNotificationService.checkNewNotification(validUserId);

            // Then
            assertTrue(hasNewNotification);
        }

        @Test
        @DisplayName("사용자가 방금 알림을 확인한 후 - 읽은 시간이 최신 알림보다 최근인 상황")
        void userJustCheckedNotifications() {

            // Given - 1시간 전 알림, 30분 전에 사용자가 읽음
            Instant oneHourAgo = now.minus(1, HOURS);
            Instant thirtyMinutesAgo = now.minus(30, java.time.temporal.ChronoUnit.MINUTES);

            Notification oldNotification = createMockNotification("old", now, oneHourAgo);
            given(notificationMongoRepository.findFirstByRecipientIdOrderByLastUpdatedAtDesc(validUserId))
                    .willReturn(Optional.of(oldNotification));
            given(lastReadAtService.getLastReadAt(validUserId))
                    .willReturn(thirtyMinutesAgo);

            // When
            boolean hasNewNotification = checkNewNotificationService.checkNewNotification(validUserId);

            // Then
            assertFalse(hasNewNotification);
        }

        @Test
        @DisplayName("알림도 없고 읽은 기록도 없는 완전히 조용한 상황")
        void inactiveUserScenario() {

            // Given
            given(notificationMongoRepository.findFirstByRecipientIdOrderByLastUpdatedAtDesc(validUserId))
                    .willReturn(Optional.empty());

            // When
            boolean hasNewNotification = checkNewNotificationService.checkNewNotification(validUserId);

            // Then
            assertFalse(hasNewNotification);
            then(lastReadAtService).shouldHaveNoInteractions();
        }
    }

    // Helper Methods - 테스트용 Mock 데이터 생성 메서드들
    private Notification createMockNotification(String id, Instant occurredAt, Instant lastUpdatedAt) {
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
                .createdAt(now)
                .lastUpdatedAt(lastUpdatedAt)
                .build();
    }
}