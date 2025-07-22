package com.stayswap.notification.service.reader;

import com.stayswap.IntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;

import java.time.Duration;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.willThrow;

@DisplayName("개별 알림 읽음 처리 서비스")
class IndividualNotificationReadServiceTest extends IntegrationTest {

    @Autowired
    private IndividualNotificationReadService individualNotificationReadService;

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    private final Long testUserId = 123L;
    private final String testNotificationId = "notification-uuid-123";
    private final String testNotificationId2 = "notification-uuid-456";
    private final String expectedRedisKey = "user:123:read_notifications";

    @BeforeEach
    void setUp() {
        // Redis 초기화
        redisTemplate.getConnectionFactory().getConnection().flushAll();
    }

    @Nested
    @DisplayName("알림 읽음 처리 기능")
    class MarkAsReadTest {

        @Test
        @DisplayName("정상: 유효한 사용자ID와 알림ID로 읽음 처리 시 Redis Set에 저장되고 90일 TTL이 설정된다")
        void markAsReadValidInputStoresInRedisWithTtl() {
            // Given
            // 테스트 시작 전 비어있는지 확인
            assertThat(redisTemplate.opsForSet().members(expectedRedisKey)).isEmpty();

            // When
            individualNotificationReadService.markAsRead(testUserId, testNotificationId);

            // Then
            Set<String> storedNotifications = redisTemplate.opsForSet().members(expectedRedisKey);
            assertThat(storedNotifications).containsExactly(testNotificationId);

            // TTL 확인 (90일 = 7776000초)
            Long ttl = redisTemplate.getExpire(expectedRedisKey);
            assertThat(ttl).isGreaterThan(7775000L).isLessThanOrEqualTo(7776000L);
        }

        @Test
        @DisplayName("중복: 이미 읽은 알림을 다시 읽음 처리해도 Set 특성으로 중복 저장되지 않는다")
        void markAsReadWithDuplicateNotificationIdDoesNotCreateDuplicateInSet() {
            // Given
            individualNotificationReadService.markAsRead(testUserId, testNotificationId);
            assertThat(redisTemplate.opsForSet().size(expectedRedisKey)).isEqualTo(1L);

            // When - 같은 알림을 다시 읽음 처리
            individualNotificationReadService.markAsRead(testUserId, testNotificationId);

            // Then - Set 특성으로 중복되지 않음
            Set<String> storedNotifications = redisTemplate.opsForSet().members(expectedRedisKey);
            assertThat(storedNotifications).hasSize(1).containsExactly(testNotificationId);
        }

        @Test
        @DisplayName("다중 알림: 서로 다른 알림ID들은 모두 Set에 저장되고 개수가 정확히 증가한다")
        void markAsReadWithMultipleNotificationIdsStoresAllInSet() {
            // Given
            assertThat(redisTemplate.opsForSet().size(expectedRedisKey)).isEqualTo(0L);

            // When
            individualNotificationReadService.markAsRead(testUserId, testNotificationId);
            individualNotificationReadService.markAsRead(testUserId, testNotificationId2);

            // Then
            Set<String> storedNotifications = redisTemplate.opsForSet().members(expectedRedisKey);
            assertThat(storedNotifications)
                    .hasSize(2)
                    .containsExactlyInAnyOrder(testNotificationId, testNotificationId2);
        }
    }

    @Nested
    @DisplayName("읽은 알림 ID 목록 조회 기능")
    class GetReadNotificationIdsTest {

        @Test
        @DisplayName("정상: 읽은 알림이 있는 사용자의 경우 Set 형태로 모든 읽은 알림 ID를 반환한다")
        void getReadNotificationIdsWithExistingReadNotificationsReturnsAllReadNotificationIds() {
            // Given
            individualNotificationReadService.markAsRead(testUserId, testNotificationId);
            individualNotificationReadService.markAsRead(testUserId, testNotificationId2);

            // When
            Set<String> readNotificationIds = individualNotificationReadService.getReadNotificationIds(testUserId);

            // Then
            assertThat(readNotificationIds)
                    .hasSize(2)
                    .containsExactlyInAnyOrder(testNotificationId, testNotificationId2);
        }

        @Test
        @DisplayName("빈결과: 읽은 알림이 없는 사용자의 경우 빈 Set을 반환한다")
        void getReadNotificationIdsWithNoReadNotificationsReturnsEmptySet() {
            // Given
            Long userWithoutReadNotifications = 999L;

            // When
            Set<String> readNotificationIds = individualNotificationReadService.getReadNotificationIds(userWithoutReadNotifications);

            // Then
            assertThat(readNotificationIds).isEmpty();
        }
    }

    @Nested
    @DisplayName("Redis 키 및 TTL 관리")
    class RedisKeyAndTTLTest {

        @Test
        @DisplayName("키패턴: 사용자 ID 123의 경우 'user:123:read_notifications' 키가 생성된다")
        void markAsReadCreatesCorrectRedisKeyPattern() {
            // Given
            Long specificUserId = 456L;
            String expectedKey = "user:456:read_notifications";

            // When
            individualNotificationReadService.markAsRead(specificUserId, testNotificationId);

            // Then
            assertThat(redisTemplate.hasKey(expectedKey)).isTrue();
            assertThat(redisTemplate.opsForSet().members(expectedKey)).containsExactly(testNotificationId);
        }

        @Test
        @DisplayName("TTL갱신: 읽음 처리 시마다 90일 TTL이 갱신되어 키 만료가 연장된다")
        void markAsReadRefreshesNinetyDayTTLOnEachCall() {
            // Given - 첫 번째 읽음 처리
            individualNotificationReadService.markAsRead(testUserId, testNotificationId);
            Long firstTtl = redisTemplate.getExpire(expectedRedisKey);

            // When - 잠시 대기 후 다른 알림 읽음 처리 (TTL 갱신 확인용)
            try {
                Thread.sleep(1000); // 1초 대기
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            individualNotificationReadService.markAsRead(testUserId, testNotificationId2);

            // Then - TTL이 갱신되어 첫 번째보다 크거나 같아야 함
            Long secondTtl = redisTemplate.getExpire(expectedRedisKey);
            assertThat(secondTtl).isGreaterThanOrEqualTo(firstTtl);
            assertThat(secondTtl).isGreaterThan(7775000L).isLessThanOrEqualTo(7776000L);
        }

        @Test
        @DisplayName("TTL상수: Duration.ofDays(90)가 정확히 7776000초(90일)로 계산된다")
        void ttlConstant() {
            // Given & When
            Duration ninetyDays = Duration.ofDays(90);
            long expectedSeconds = 90L * 24L * 60L * 60L; // 90일 * 24시간 * 60분 * 60초

            // Then
            assertThat(ninetyDays.getSeconds()).isEqualTo(expectedSeconds).isEqualTo(7776000L);
        }
    }

    @Nested
    @DisplayName("사용자별 격리 테스트")
    class UserIsolationTest {

        @Test
        @DisplayName("사용자 격리: 서로 다른 사용자의 읽은 알림은 독립적으로 관리되고 서로 영향을 주지 않는다")
        void markAsReadSameNotificationIdDifferentUsersBothCanMarkAsRead() {
            // Given
            Long user1 = 100L;
            Long user2 = 200L;
            String notification1 = "notif-1";
            String notification2 = "notif-2";

            // When
            individualNotificationReadService.markAsRead(user1, notification1);
            individualNotificationReadService.markAsRead(user2, notification2);

            // Then
            Set<String> user1ReadNotifications = individualNotificationReadService.getReadNotificationIds(user1);
            Set<String> user2ReadNotifications = individualNotificationReadService.getReadNotificationIds(user2);

            assertThat(user1ReadNotifications).containsExactly(notification1);
            assertThat(user2ReadNotifications).containsExactly(notification2);
            
            // 교차 확인 - 각자의 알림만 있어야 함
            assertThat(user1ReadNotifications).doesNotContain(notification2);
            assertThat(user2ReadNotifications).doesNotContain(notification1);
        }
    }
}