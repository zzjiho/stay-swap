package com.stayswap.notification.service.reader;

import com.stayswap.error.exception.NotFoundException;
import com.stayswap.notification.document.Notification;
import com.stayswap.notification.document.TestNotification;
import com.stayswap.notification.dto.response.NotificationListResponse;
import com.stayswap.notification.dto.response.NotificationResponse;
import com.stayswap.notification.repository.NotificationMongoRepository;
import com.stayswap.user.model.entity.User;
import com.stayswap.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static com.stayswap.code.ErrorCode.NOT_EXISTS_USER;
import static com.stayswap.notification.constant.NotificationType.TEST_NOTIFICATION;
import static java.time.temporal.ChronoUnit.DAYS;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("알림 목록 조회 서비스")
class NotificationListServiceTest {

    @Mock
    private NotificationMongoRepository notificationMongoRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private IndividualNotificationReadService individualNotificationReadService;

    @InjectMocks
    private NotificationListService notificationListService;

    private final Long validUserId = 123L;
    private final Long invalidUserId = 999L;
    private final Instant now = Instant.now();
    private final Instant pivot = now.minus(2, DAYS);

    private User mockUser;
    private List<Notification> mockNotifications;

    @BeforeEach
    void setUp() {
        mockUser = createMockUser(validUserId);
        mockNotifications = createMockNotifications();
    }

    @Nested
    @DisplayName("사용자 검증 테스트 - 알림 조회 전 사용자 존재 여부 확인")
    class UserValidationTest {

        @Test
        @DisplayName("정상 케이스: 존재하는 사용자 ID로 요청시 사용자 검증이 통과하고 알림 목록 조회가 진행된다")
        void validUserPassesValidationAndProceedsToNotificationRetrieval() {

            // Given
            given(userRepository.findById(validUserId)).willReturn(Optional.of(mockUser));
            given(notificationMongoRepository.findAllByRecipientIdOrderByOccurredAtDesc(eq(validUserId), any()))
                    .willReturn(createMockSlice(mockNotifications, true));
            given(individualNotificationReadService.getReadNotificationIds(validUserId))
                    .willReturn(Set.of());
            given(userRepository.findByIdIn(any())).willReturn(List.of(createMockUser(456L)));

            // When
            NotificationListResponse response = notificationListService.getUserNotificationsByPivot(validUserId, null);

            // Then
            assertNotNull(response);
            verify(userRepository).findById(validUserId);
            verify(notificationMongoRepository).findAllByRecipientIdOrderByOccurredAtDesc(eq(validUserId), any());
        }

        @Test
        @DisplayName("예외 케이스: 존재하지 않는 사용자 ID로 요청시 NotFoundException이 발생하고 알림 조회는 실행되지 않는다")
        void invalidUserThrowsNotFoundExceptionWithoutNotificationRetrieval() {

            // Given
            given(userRepository.findById(invalidUserId)).willReturn(Optional.empty());

            // When & Then
            NotFoundException exception = assertThrows(NotFoundException.class, () ->
                    notificationListService.getUserNotificationsByPivot(invalidUserId, null));

            assertEquals(NOT_EXISTS_USER, exception.getErrorCode());
            verify(userRepository).findById(invalidUserId);
            verify(notificationMongoRepository, Mockito.never()).findAllByRecipientIdOrderByOccurredAtDesc(any(), any());
            verify(notificationMongoRepository, Mockito.never()).findAllByRecipientIdAndOccurredAtLessThanOrderByOccurredAtDesc(any(), any(), any());
        }
    }

    @Nested
    @DisplayName("첫 번째 페이지 조회 테스트 - pivot이 null일 때 최신 알림부터 조회")
    class FirstPageRetrievalTest {

        @Test
        @DisplayName("정상 케이스: pivot=null로 요청시 최신 알림 5개를 조회하고 다음 페이지가 있으면 마지막 알림의 시간을 nextPivot으로 설정")
        void firstPageWithNullPivotReturnsLatestNotificationsWithNextPivot() {

            // Given
            given(userRepository.findById(validUserId)).willReturn(Optional.of(mockUser));
            given(notificationMongoRepository.findAllByRecipientIdOrderByOccurredAtDesc(eq(validUserId), any()))
                    .willReturn(createMockSlice(mockNotifications, true));
            given(individualNotificationReadService.getReadNotificationIds(validUserId))
                    .willReturn(Set.of());
            given(userRepository.findByIdIn(any())).willReturn(List.of(createMockUser(456L)));

            // When
            NotificationListResponse response = notificationListService.getUserNotificationsByPivot(validUserId, null);

            // Then
            assertNotNull(response);
            assertEquals(3, response.getNotifications().size());
            assertTrue(response.isHasNext());
            assertNotNull(response.getPivot());

            // nextPivot은 마지막 알림의 occurredAt과 같아야 함
            Instant expectedNextPivot = mockNotifications.get(2).getOccurredAt();
            assertEquals(expectedNextPivot, response.getPivot());
            verify(notificationMongoRepository).findAllByRecipientIdOrderByOccurredAtDesc(
                    eq(validUserId),
                    eq(PageRequest.of(0, 5)));
        }

        @Test
        @DisplayName("마지막 페이지 케이스: pivot=null로 요청했는데 더 이상 알림이 없으면 hasNext=false이고 nextPivot=null이다.")
        void firstPageWithNoMoreNotificationsReturnsHasNextFalseAndNullPivot() {

            // Given
            given(userRepository.findById(validUserId)).willReturn(Optional.of(mockUser));
            given(notificationMongoRepository.findAllByRecipientIdOrderByOccurredAtDesc(eq(validUserId), any()))
                    .willReturn(createMockSlice(mockNotifications, false));
            given(individualNotificationReadService.getReadNotificationIds(validUserId))
                    .willReturn(Set.of());
            given(userRepository.findByIdIn(any())).willReturn(List.of(createMockUser(456L)));

            // When
            NotificationListResponse response = notificationListService.getUserNotificationsByPivot(validUserId, null);

            // Then
            assertNotNull(response);
            assertEquals(3, response.getNotifications().size());
            assertFalse(response.isHasNext());
            assertNull(response.getPivot());
        }

        @Test
        @DisplayName("빈 결과 케이스: 사용자에게 알림이 하나도 없으면 빈 리스트를 반환하고 hasNext=false, nextPivot=null")
        void firstPageWithNoNotificationsReturnsEmptyListWithNullPivot() {

            // Given
            given(userRepository.findById(validUserId)).willReturn(Optional.of(mockUser));
            given(notificationMongoRepository.findAllByRecipientIdOrderByOccurredAtDesc(eq(validUserId), any()))
                    .willReturn(createMockSlice(Collections.emptyList(), false));
            given(individualNotificationReadService.getReadNotificationIds(validUserId))
                    .willReturn(Set.of());
            given(userRepository.findByIdIn(any())).willReturn(List.of(createMockUser(456L)));

            // When
            NotificationListResponse response = notificationListService.getUserNotificationsByPivot(validUserId, null);

            // Then
            assertNotNull(response);
            assertEquals(0, response.getNotifications().size());
            assertFalse(response.isHasNext());
            assertNull(response.getPivot());
        }
    }

    @Nested
    @DisplayName("다음 페이지 조회 테스트 - pivot이 있을 때 해당 시점 이전 알림 조회")
    class NextPageRetrievalTest {

        @Test
        @DisplayName("정상 케이스: 유효한 pivot으로 요청시 해당 시점 이전 알림들을 조회하고 더 이전 알림이 있으면 마지막 알림 시간을 nextPivot으로 설정")
        void nextPageWithValidPivotReturnsOlderNotificationsWithNextPivot() {

            // Given
            List<Notification> olderNotifications = createOlderMockNotifications();
            given(userRepository.findById(validUserId)).willReturn(Optional.of(mockUser));
            given(notificationMongoRepository.findAllByRecipientIdAndOccurredAtLessThanOrderByOccurredAtDesc(
                    eq(validUserId), eq(pivot), any()))
                    .willReturn(createMockSlice(olderNotifications, true));
            given(individualNotificationReadService.getReadNotificationIds(validUserId))
                    .willReturn(Set.of());
            given(userRepository.findByIdIn(any())).willReturn(List.of(createMockUser(456L)));

            // When
            NotificationListResponse response = notificationListService.getUserNotificationsByPivot(validUserId, pivot);

            // Then
            assertNotNull(response);
            assertEquals(3, response.getNotifications().size());
            assertTrue(response.isHasNext());
            assertNotNull(response.getPivot());

            Instant expectedNextPivot = olderNotifications.get(2).getOccurredAt();
            assertEquals(expectedNextPivot, response.getPivot());
            verify(notificationMongoRepository).findAllByRecipientIdAndOccurredAtLessThanOrderByOccurredAtDesc(
                    eq(validUserId), eq(pivot), eq(PageRequest.of(0, 5)));
        }

        @Test
        @DisplayName("마지막 페이지 케이스: pivot으로 조회했는데 더 이전 알림이 없으면 hasNext=false이고 nextPivot=null")
        void nextPageWithNoMoreOlderNotificationsReturnsHasNextFalseAndNullPivot() {

            // Given
            List<Notification> lastPageNotifications = Arrays.asList(
                    createMockNotification("last-1", now.minus(5, DAYS)),
                    createMockNotification("last-2", now.minus(6, DAYS))
            );
            given(userRepository.findById(validUserId)).willReturn(Optional.of(mockUser));
            given(notificationMongoRepository.findAllByRecipientIdAndOccurredAtLessThanOrderByOccurredAtDesc(
                    eq(validUserId), eq(pivot), any()))
                    .willReturn(createMockSlice(lastPageNotifications, false));
            given(individualNotificationReadService.getReadNotificationIds(validUserId))
                    .willReturn(Set.of());
            given(userRepository.findByIdIn(any())).willReturn(List.of(createMockUser(456L)));

            // When
            NotificationListResponse response = notificationListService.getUserNotificationsByPivot(validUserId, pivot);

            // Then
            assertNotNull(response);
            assertEquals(2, response.getNotifications().size());
            assertFalse(response.isHasNext());
            assertNull(response.getPivot());
        }

        @Test
        @DisplayName("빈 결과 케이스: pivot 이전에 알림이 하나도 없으면 빈 리스트를 반환하고 hasNext=false, nextPivot=null")
        void nextPageWithNoOlderNotificationsReturnsEmptyListWithNullPivot() {

            // Given
            given(userRepository.findById(validUserId)).willReturn(Optional.of(mockUser));
            given(notificationMongoRepository.findAllByRecipientIdAndOccurredAtLessThanOrderByOccurredAtDesc(
                    eq(validUserId), eq(pivot), any()))
                    .willReturn(createMockSlice(Collections.emptyList(), false));
            given(individualNotificationReadService.getReadNotificationIds(validUserId))
                    .willReturn(Set.of());
            given(userRepository.findByIdIn(any())).willReturn(List.of(createMockUser(456L)));

            // When
            NotificationListResponse response = notificationListService.getUserNotificationsByPivot(validUserId, pivot);

            // Then
            assertNotNull(response);
            assertEquals(0, response.getNotifications().size());
            assertFalse(response.isHasNext());
            assertNull(response.getPivot());
        }
    }

    @Nested
    @DisplayName("응답 데이터 변환 테스트 - Notification 엔티티를 NotificationResponse DTO로 변환")
    class ResponseDataTransformationTest {

        @Test
        @DisplayName("정상 변환: Repository에서 반환된 Notification 엔티티들이 NotificationResponse DTO로 정확히 변환된다")
        void notificationEntitiesAreCorrectlyTransformedToResponseDTOs() {

            // Given
            given(userRepository.findById(validUserId)).willReturn(Optional.of(mockUser));
            given(notificationMongoRepository.findAllByRecipientIdOrderByOccurredAtDesc(eq(validUserId), any()))
                    .willReturn(createMockSlice(mockNotifications, false));
            given(individualNotificationReadService.getReadNotificationIds(validUserId))
                    .willReturn(Set.of());
            given(userRepository.findByIdIn(any())).willReturn(List.of(createMockUser(456L)));

            // When
            NotificationListResponse response = notificationListService.getUserNotificationsByPivot(validUserId, null);

            // Then
            assertNotNull(response);
            assertEquals(3, response.getNotifications().size());

            List<NotificationResponse> notifications = response.getNotifications();
            for (int i = 0; i < notifications.size(); i++) {
                NotificationResponse responseDto = notifications.get(i);
                Notification originalEntity = mockNotifications.get(i);

                assertEquals(originalEntity.getId(), responseDto.getId());
                assertEquals(originalEntity.getRecipientId(), responseDto.getRecipientId());
                assertEquals(originalEntity.getOccurredAt(), responseDto.getOccurredAt());
            }
        }
    }

    @Nested
    @DisplayName("페이지 크기 고정값 테스트 - 항상 5개씩 조회하는 비즈니스 규칙 검증")
    class PageSizeConstantTest {

        @Test
        @DisplayName("페이지 크기 검증: 첫 번째 페이지 조회시 항상 PageRequest.of(0, 5)으로 Repository를 호출한다")
        void firstPageAlwaysUsesPageSizeFive() {

            // Given
            when(userRepository.findById(validUserId)).thenReturn(Optional.of(mockUser));
            when(notificationMongoRepository.findAllByRecipientIdOrderByOccurredAtDesc(eq(validUserId), any()))
                    .thenReturn(createMockSlice(mockNotifications, false));
            when(individualNotificationReadService.getReadNotificationIds(validUserId))
                    .thenReturn(Set.of());
            when(userRepository.findByIdIn(any())).thenReturn(List.of(createMockUser(456L)));

            // When
            notificationListService.getUserNotificationsByPivot(validUserId, null);

            // Then
            verify(notificationMongoRepository).findAllByRecipientIdOrderByOccurredAtDesc(
                    eq(validUserId), eq(PageRequest.of(0, 5))); // 페이지 크기 5 확인
        }

        @Test
        @DisplayName("페이지 크기 검증: 다음 페이지 조회시에도 항상 PageRequest.of(0, 5)으로 Repository를 호출한다")
        void nextPageAlwaysUsesPageSizeFive() {
            // Given
            when(userRepository.findById(validUserId)).thenReturn(Optional.of(mockUser));
            when(notificationMongoRepository.findAllByRecipientIdAndOccurredAtLessThanOrderByOccurredAtDesc(
                    eq(validUserId), eq(pivot), any()))
                    .thenReturn(createMockSlice(mockNotifications, false));
            when(individualNotificationReadService.getReadNotificationIds(validUserId))
                    .thenReturn(Set.of());

            // When
            notificationListService.getUserNotificationsByPivot(validUserId, pivot);

            // Then
            verify(notificationMongoRepository).findAllByRecipientIdAndOccurredAtLessThanOrderByOccurredAtDesc(
                    eq(validUserId), eq(pivot), eq(PageRequest.of(0, 5))); // 페이지 크기 5 확인
        }
    }

    private User createMockUser(Long userId) {
        User user = User.builder()
                .id(userId)
                .email("hong@gmail.com")
                .userName("홍길동")
                .build();
        return user;
    }

    private List<Notification> createMockNotifications() {
        return Arrays.asList(
                createMockNotification("notification-1", now.minus(1, DAYS)),
                createMockNotification("notification-2", now.minus(2, DAYS)),
                createMockNotification("notification-3", now.minus(3, DAYS))
        );
    }

    private List<Notification> createOlderMockNotifications() {
        return Arrays.asList(
                createMockNotification("older-1", now.minus(4, DAYS)),
                createMockNotification("older-2", now.minus(5, DAYS)),
                createMockNotification("older-3", now.minus(6, DAYS))
        );
    }

    private Notification createMockNotification(String id, Instant occurredAt) {
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
                .lastUpdatedAt(now)
                .build();
    }

    private Slice<Notification> createMockSlice(List<Notification> content, boolean hasNext) {
        return new SliceImpl<>(content, PageRequest.of(0, 5), hasNext);
    }
}