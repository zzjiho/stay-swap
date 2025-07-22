package com.stayswap.notification.repository;

import com.stayswap.IntegrationTest;
import com.stayswap.notification.document.Notification;
import com.stayswap.notification.document.TestNotification;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

import java.time.Instant;
import java.util.Optional;

import static com.stayswap.notification.constant.NotificationType.TEST_NOTIFICATION;
import static java.time.temporal.ChronoUnit.DAYS;
import static org.junit.jupiter.api.Assertions.*;

class NotificationMongoRepositoryTest extends IntegrationTest {

    @Autowired
    private NotificationMongoRepository sut;

    private final Long recipientId = 2L;
    private final Long senderId = 4L;
    private final Long referenceId = 5L;
    private final String title = "테스트 알림";
    private final String content = "테스트 알림 내용입니다.";
    private final Instant now = Instant.now();

    @BeforeEach
    void setUp() {
        for (int i = 1; i <= 5; i++) {
            Instant occurredAt = now.minus(i, DAYS);
            sut.save(createNotification("id-" + i, occurredAt));
        }
    }

    @AfterEach
    void tearDown() {
        sut.deleteAll();
    }

    @Test
    void testSave() {
        String id = "1";
        sut.save(createNotification(id, now));
        Optional<Notification> optionalNotification = sut.findById(id);

        assertTrue(optionalNotification.isPresent());
    }

    @Test
    void testFindById() {
        String id = "2";

        sut.save(createNotification(id, now));
        Optional<Notification> optionalNotification = sut.findById(id);

        TestNotification notification = (TestNotification) optionalNotification.orElseThrow();
        assertEquals(notification.getId(), id);
        assertEquals(notification.getRecipientId(), recipientId);
        assertEquals(notification.getSenderId(), senderId);
        assertEquals(notification.getReferenceId(), referenceId);
        assertEquals(notification.getTitle(), title);
        assertEquals(notification.getContent(), content);
        assertEquals(notification.getType(), TEST_NOTIFICATION);
        assertEquals(notification.getOccurredAt().getEpochSecond(), now.getEpochSecond());
        assertEquals(notification.getCreatedAt().getEpochSecond(), now.getEpochSecond());
        assertEquals(notification.getLastUpdatedAt().getEpochSecond(), now.getEpochSecond());
    }

    @Test
    void testDeleteById() {
        String id = "3";

        sut.save(createNotification(id, now));
        sut.deleteById(id);
        Optional<Notification> optionalNotification = sut.findById(id);

        assertFalse(optionalNotification.isPresent());
    }

    @Nested
    @DisplayName("사용자별 알림 목록 조회 테스트 (시간순 내림차순 정렬)")
    class FindAllByRecipientIdOrderByOccurredAtDescTest {

        @Test
        @DisplayName("최신 알림 조회 성공: 전체 5개 알림 중 occurredAt 기준 가장 최신 3개를 시간순 내림차순으로 반환하고 더 이전 알림 존재로 hasNext=true")
        void normalCase() {

            // Given
            Pageable pageable = PageRequest.of(0, 3);

            // When
            Slice<Notification> result = sut.findAllByRecipientIdOrderByOccurredAtDesc(recipientId, pageable);

            // Then
            assertEquals(3, result.getContent().size());
            assertTrue(result.hasNext());

            // 시간순 내림차순 정렬 검증 (최신->과거)
            Notification first = result.getContent().get(0);
            Notification second = result.getContent().get(1);
            Notification third = result.getContent().get(2);

            assertTrue(first.getOccurredAt().isAfter(second.getOccurredAt()));
            assertTrue(second.getOccurredAt().isAfter(third.getOccurredAt()));
        }

        @Test
        @DisplayName("요청 개수 초과 상황: 요청 개수(10개)가 전체 알림(5개)보다 많을 때 전체 5개만 반환하고 추가 데이터 없음으로 hasNext=false")
        void pageSizeLargerThanDataReturnsAllData() {

            // Given
            Pageable pageable = PageRequest.of(0, 10);

            // When
            Slice<Notification> result = sut.findAllByRecipientIdOrderByOccurredAtDesc(recipientId, pageable);

            // Then
            assertEquals(5, result.getContent().size());
            assertFalse(result.hasNext());

            // 모든 데이터가 올바른 사용자의 것인지 확인
            result.getContent().forEach(notification ->
                    assertEquals(recipientId, notification.getRecipientId()));
        }

        @Test
        @DisplayName("최소 요청 개수: 1개씩 조회 시 가장 최신 알림 1개만 반환하고 나머지 4개 존재로 hasNext=true")
        void returnsSingleLatestNotificationWithHasNextTrue() {
            // Given
            Pageable pageable = PageRequest.of(0, 1);

            // When
            Slice<Notification> result = sut.findAllByRecipientIdOrderByOccurredAtDesc(recipientId, pageable);

            // Then
            assertEquals(1, result.getContent().size());
            assertTrue(result.hasNext());

            // 가장 최신 알림(1일 전)이 반환되는지 확인
            Notification latestNotification = result.getContent().get(0);
            assertEquals("id-1", latestNotification.getId());
        }

        @Test
        @DisplayName("존재하지 않는 사용자: 데이터가 없는 사용자 ID로 조회 시 빈 결과 반환하고 hasNext=false")
        void returnsEmptyResultForNonExistentUser() {
            // Given
            Long nonExistentUserId = 99999L;
            Pageable pageable = PageRequest.of(0, 3);

            // When
            Slice<Notification> result = sut.findAllByRecipientIdOrderByOccurredAtDesc(nonExistentUserId, pageable);

            // Then
            assertEquals(0, result.getContent().size());
            assertFalse(result.hasNext());
        }

    }

    @DisplayName("특정 시점 이전의 알림들을 조회하는 기능 검증" +
            "현재 시점(now) 이전의 알림들이 올바르게 조회되고 정렬되는지 확인")
    @Test
    void testFindAllByRecipientIdAndOccurredAtLessThanOrderByOccurredAtDescFirstQuery() {
        Pageable pageable = PageRequest.of(0, 3);

        Slice<Notification> result = sut.findAllByRecipientIdAndOccurredAtLessThanOrderByOccurredAtDesc(recipientId, now, pageable);

        assertEquals(3, result.getContent().size());
        assertTrue(result.hasNext());

        Notification first = result.getContent().get(0);
        Notification second = result.getContent().get(1);
        Notification third = result.getContent().get(2);

        assertTrue(first.getOccurredAt().isAfter(second.getOccurredAt()));
        assertTrue(second.getOccurredAt().isAfter(third.getOccurredAt()));
    }

    @DisplayName("피벗 시점 활용하여 다음 페이지 조회 기능 검증")
    @Test
    void testFindAllByRecipientIdAndOccurredAtLessThanOrderByOccurredAtDescSecondQueryWithPivot() {
        // given
        Pageable pageable = PageRequest.of(0, 3);
        Slice<Notification> firstResult = sut.findAllByRecipientIdAndOccurredAtLessThanOrderByOccurredAtDesc(recipientId, now, pageable);

        // 첫번째 결과의 마지막 항목 시간을 피벗으로 설정
        Notification last = firstResult.getContent().get(2);
        Instant pivot = last.getOccurredAt();

        // when
        Slice<Notification> secondResult = sut.findAllByRecipientIdAndOccurredAtLessThanOrderByOccurredAtDesc(recipientId, pivot, pageable);

        // then
        assertEquals(2, secondResult.getContent().size());
        assertFalse(secondResult.hasNext());

        Notification first = secondResult.getContent().get(0);
        Notification second = secondResult.getContent().get(1);

        assertTrue(first.getOccurredAt().isAfter(second.getOccurredAt()));
    }

    private Notification createNotification(String id, Instant occurredAt) {
        return TestNotification.builder()
                .id(id)
                .recipientId(recipientId)
                .senderId(senderId)
                .referenceId(referenceId)
                .title(title)
                .content(content)
                .type(TEST_NOTIFICATION)
                .isRead(false)
                .occurredAt(occurredAt)
                .createdAt(now)
                .lastUpdatedAt(now)
                .build();
    }


}