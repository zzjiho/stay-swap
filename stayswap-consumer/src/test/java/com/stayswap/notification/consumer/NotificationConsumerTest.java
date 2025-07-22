package com.stayswap.notification.consumer;

import com.stayswap.ConsumerIntegrationTest;
import com.stayswap.error.exception.NotFoundException;
import com.stayswap.notification.constant.NotificationType;
import com.stayswap.notification.document.Notification;
import com.stayswap.notification.dto.request.NotificationMessage;
import com.stayswap.user.model.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.stream.binder.test.InputDestination;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;

import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static com.stayswap.code.ErrorCode.NOT_EXISTS_USER;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.awaitility.Awaitility.await;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@DisplayName("일반 알림 Consumer 테스트")
class NotificationConsumerTest extends ConsumerIntegrationTest {

    @Autowired
    // Kafka message가 실제로 들어오는 상황 시뮬레이션
    private InputDestination inputDestination;

    @Autowired
    private NotificationConsumer notificationConsumer;

    private User testUser;
    private NotificationMessage testBookingNotificationMessage;
    private NotificationMessage testSwapNotificationMessage;
    private Notification testNotification;
    private Notification testSwapNotification;

    @BeforeEach
    void setUp() {
        reset(userRepository, notificationMongoRepository, pushNotificationService);

        testUser = User.builder()
                .id(1L)
                .email("sender@example.com")
                .nickname("테스트유저")
                .build();

        testBookingNotificationMessage = NotificationMessage.builder()
                .senderId(1L)
                .recipientId(2L)
                .title("숙박 요청 알림")
                .content("새로운 숙박 요청이 도착했습니다")
                .type(NotificationType.BOOKING_REQUEST)
                .referenceId(100L)
                .occurredAt(Instant.now())
                .build();

        testSwapNotificationMessage = NotificationMessage.builder()
                .senderId(1L)
                .recipientId(2L)
                .title("교환 요청 알림")
                .content("새로운 교환 요청이 도착했습니다")
                .type(NotificationType.SWAP_REQUEST)
                .referenceId(200L)
                .occurredAt(Instant.now())
                .build();

        testNotification = Notification.of(testBookingNotificationMessage);
        testSwapNotification = Notification.of(testSwapNotificationMessage);
    }

    @Nested
    @DisplayName("정상 처리 테스트 (MongoDB 저장 + FCM 전송)")
    class SuccessfulProcessingTests {

        @Test
        @DisplayName("숙박 요청 알림 메시지 수신 시 MongoDB 저장과 FCM 푸시 알림이 모두 정상 처리된다")
        @Timeout(10)
        void shouldProcessBookingNotificationWithFCMSuccessfully_WithInputDestination() {

            // Given
            given(userRepository.findById(1L)).willReturn(Optional.of(testUser));
            given(userRepository.findById(2L)).willReturn(Optional.of(testUser));
            given(notificationMongoRepository.save(any(Notification.class)))
                    .willReturn(testNotification);

            Message<NotificationMessage> message = MessageBuilder
                    .withPayload(testBookingNotificationMessage)
                    .setHeader("messageId", "booking-notification-123")
                    .build();

            // When
            inputDestination.send(message, "notification");

            // Then
            await().pollDelay(500, TimeUnit.MILLISECONDS)
                    .atMost(5, TimeUnit.SECONDS)
                    .untilAsserted(() -> {
                        verify(userRepository, times(1)).findById(1L);
                        verify(notificationMongoRepository, times(1)).save(any(Notification.class));
                        verify(pushNotificationService, times(1))
                                .sendPushNotificationToUser(
                                        eq(2L),
                                        eq("숙박 요청 알림"),
                                        eq("새로운 숙박 요청이 도착했습니다"),
                                        eq(NotificationType.BOOKING_REQUEST),
                                        eq(100L)
                                );
                    });
        }

        @Test
        @DisplayName("교환 요청 알림 메시지 직접 처리 시 저장과 FCM 전송이 정상 수행된다")
        @Timeout(5)
        void shouldProcessSwapNotificationSuccessfully_DirectCall() {

            // Given
            given(userRepository.findById(1L)).willReturn(Optional.of(testUser));
            given(userRepository.findById(2L)).willReturn(Optional.of(testUser));
            given(notificationMongoRepository.save(any(Notification.class)))
                    .willReturn(testSwapNotification);

            // When
            notificationConsumer.processNotification(testSwapNotificationMessage);

            // Then
            verify(userRepository, times(1)).findById(1L);
            verify(notificationMongoRepository, times(1)).save(any(Notification.class));
            verify(pushNotificationService, times(1))
                    .sendPushNotificationToUser(
                            eq(2L),
                            eq("교환 요청 알림"),
                            eq("새로운 교환 요청이 도착했습니다"),
                            eq(NotificationType.SWAP_REQUEST),
                            eq(200L)
                    );
        }

        @Test
        @DisplayName("Consumer Bean 함수 직접 호출 시 메시지가 정상적으로 처리되고 FCM도 전송된다")
        @Timeout(5)
        void shouldConsumerBeanWorkCorrectlyWithFCM() {

            // Given
            given(userRepository.findById(1L)).willReturn(Optional.of(testUser));
            given(userRepository.findById(2L)).willReturn(Optional.of(testUser));
            given(notificationMongoRepository.save(any(Notification.class)))
                    .willReturn(testNotification);

            // When
            var consumer = notificationConsumer.notification();
            consumer.accept(testBookingNotificationMessage);

            // Then
            verify(userRepository, times(1)).findById(1L);
            verify(notificationMongoRepository, times(1)).save(any(Notification.class));
            verify(pushNotificationService, times(1))
                    .sendPushNotificationToUser(anyLong(), any(), any(), any(), anyLong());
        }

        @Test
        @DisplayName("헤더를 포함한 메시지 전송 시 헤더 정보와 함께 메시지가 정상 처리되고 FCM도 전송된다")
        @Timeout(10)
        void shouldProcessMessageWithHeadersAndFCM() {

            // Given
            given(userRepository.findById(1L)).willReturn(Optional.of(testUser));
            given(userRepository.findById(2L)).willReturn(Optional.of(testUser));
            given(notificationMongoRepository.save(any(Notification.class)))
                    .willReturn(testNotification);

            Message<NotificationMessage> message = MessageBuilder
                    .withPayload(testBookingNotificationMessage)
                    .setHeader("messageId", "test-header-123")
                    .setHeader("source", "booking-service")
                    .setHeader("version", "1.0")
                    .build();

            // When
            inputDestination.send(message, "notification");

            // Then
            await().pollDelay(500, TimeUnit.MILLISECONDS)
                    .atMost(5, TimeUnit.SECONDS)
                    .untilAsserted(() -> {
                        verify(userRepository, times(1)).findById(1L);
                        verify(notificationMongoRepository, times(1)).save(any(Notification.class));
                        verify(pushNotificationService, times(1))
                                .sendPushNotificationToUser(anyLong(), any(), any(), any(), anyLong());
                    });
        }
    }

    @Nested
    @DisplayName("예외 처리 테스트")
    class ExceptionHandlingTests {

        @Test
        @DisplayName("존재하지 않는 사용자 ID로 메시지 전송 시 알림 저장과 FCM 전송이 모두 수행되지 않는다")
        @Timeout(10)
        void shouldHandleUserNotFoundExceptionGracefully_WithInputDestination() {

            // Given
            given(userRepository.findById(1L)).willReturn(Optional.empty());

            Message<NotificationMessage> message = MessageBuilder
                    .withPayload(testBookingNotificationMessage)
                    .build();

            // When
            inputDestination.send(message, "notification");

            // Then
            await().pollDelay(1, TimeUnit.SECONDS)
                    .atMost(10, TimeUnit.SECONDS)
                    .untilAsserted(() -> {
                        verify(userRepository, times(1)).findById(1L);
                        verify(notificationMongoRepository, never()).save(any(Notification.class));
                        verify(pushNotificationService, never())
                                .sendPushNotificationToUser(anyLong(), any(), any(), any(), anyLong());
                    });
        }

        @Test
        @DisplayName("존재하지 않는 사용자 ID로 직접 메서드 호출 시 NOT_EXISTS_USER 예외가 발생한다")
        @Timeout(5)
        void shouldHandleUserNotFoundExceptionGracefully_DirectCall() {

            // Given
            given(userRepository.findById(1L)).willReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() ->
                    notificationConsumer.processNotification(testBookingNotificationMessage))
                    .isInstanceOf(NotFoundException.class)
                    .hasFieldOrPropertyWithValue("errorCode", NOT_EXISTS_USER);

            verify(userRepository, times(1)).findById(1L);
            verify(notificationMongoRepository, never()).save(any(Notification.class));
            verify(pushNotificationService, never())
                    .sendPushNotificationToUser(anyLong(), any(), any(), any(), anyLong());
        }

        @Test
        @DisplayName("MongoDB 저장 실패 시 FCM 전송도 수행되지 않고 RuntimeException이 발생한다")
        @Timeout(5)
        void shouldHandleMongoSaveException() {

            // Given
            given(userRepository.findById(1L)).willReturn(Optional.of(testUser));
            given(userRepository.findById(2L)).willReturn(Optional.of(testUser));
            given(notificationMongoRepository.save(any(Notification.class)))
                    .willThrow(new RuntimeException("MongoDB 연결 실패"));

            // When & Then
            assertThatThrownBy(() ->
                    notificationConsumer.processNotification(testBookingNotificationMessage))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("MongoDB 연결 실패");

            verify(userRepository, times(1)).findById(1L);
            verify(notificationMongoRepository, times(1)).save(any(Notification.class));
            verify(pushNotificationService, never())
                    .sendPushNotificationToUser(anyLong(), any(), any(), any(), anyLong());
        }

        @Test
        @DisplayName("null senderId를 가진 메시지 처리 시 예외가 발생하고 저장 및 FCM 전송이 수행되지 않는다")
        @Timeout(5)
        void shouldHandleInvalidMessage() {

            // Given
            NotificationMessage invalidMessage = NotificationMessage.builder()
                    .senderId(null)
                    .recipientId(2L)
                    .title("잘못된 메시지")
                    .content("senderId가 null인 메시지")
                    .type(NotificationType.BOOKING_REQUEST)
                    .build();

            // When & Then
            inputDestination.send(
                    MessageBuilder.withPayload(invalidMessage).build(),
                    "notification"
            );

            await().pollDelay(1, TimeUnit.SECONDS)
                    .during(3, TimeUnit.SECONDS)
                    .untilAsserted(() -> {
                        verify(notificationMongoRepository, never()).save(any(Notification.class));
                        verify(pushNotificationService, never())
                                .sendPushNotificationToUser(anyLong(), any(), any(), any(), anyLong());
                    });
        }
    }

    @Nested
    @DisplayName("FCM 관련 특별 테스트")
    class FCMSpecificTests {

        @Test
        @DisplayName("MongoDB 저장 성공 후 FCM 전송 실패 시에도 알림은 저장된 상태로 유지된다")
        @Timeout(5)
        void shouldSaveNotificationEvenWhenFCMFails() {

            // Given
            given(userRepository.findById(1L))
                    .willReturn(Optional.of(testUser));
            given(notificationMongoRepository.save(any(Notification.class)))
                    .willReturn(testNotification);

            doThrow(new RuntimeException("FCM 전송 실패"))
                    .when(pushNotificationService)
                    .sendPushNotificationToUser(anyLong(), any(), any(), any(), anyLong());

            // When & Then
            assertThatThrownBy(() ->
                    notificationConsumer.processNotification(testBookingNotificationMessage))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("FCM 전송 실패");

            // MongoDB 저장은 성공했어야 함
            verify(userRepository, times(1)).findById(1L);
            verify(notificationMongoRepository, times(1)).save(any(Notification.class));
            verify(pushNotificationService, times(1))
                    .sendPushNotificationToUser(anyLong(), any(), any(), any(), anyLong());
        }

        @Test
        @DisplayName("FCM 전송 파라미터가 정확하게 전달되는지 검증")
        @Timeout(5)
        void shouldPassCorrectParametersToFCM() {

            // Given
            given(userRepository.findById(1L)).willReturn(Optional.of(testUser));
            given(userRepository.findById(2L)).willReturn(Optional.of(testUser));
            given(notificationMongoRepository.save(any(Notification.class)))
                    .willReturn(testNotification);

            // When
            notificationConsumer.processNotification(testBookingNotificationMessage);

            // Then
            verify(pushNotificationService, times(1))
                    .sendPushNotificationToUser(
                            eq(testBookingNotificationMessage.getRecipientId()),
                            eq(testBookingNotificationMessage.getTitle()),
                            eq(testBookingNotificationMessage.getContent()),
                            eq(testBookingNotificationMessage.getType()),
                            eq(testBookingNotificationMessage.getReferenceId())
                    );
        }
    }

    @Nested
    @DisplayName("다중 메시지 처리 테스트")
    class MultipleMessageTests {

        @Test
        @DisplayName("여러 알림 메시지 순차적 전송 시 모든 메시지가 독립적으로 처리되고 FCM도 각각 전송된다")
        @Timeout(15)
        void shouldProcessMultipleNotificationsSequentially() {

            // Given
            User user1 = User.builder().id(1L).email("user1@test.com").build();
            User user2 = User.builder().id(2L).email("user2@test.com").build();
            User user3 = User.builder().id(3L).email("user3@test.com").build();
            User recipientUser = User.builder().id(100L).email("recipient@test.com").build();

            given(userRepository.findById(1L)).willReturn(Optional.of(user1));
            given(userRepository.findById(2L)).willReturn(Optional.of(user2));
            given(userRepository.findById(3L)).willReturn(Optional.of(user3));
            given(userRepository.findById(100L)).willReturn(Optional.of(recipientUser));
            given(notificationMongoRepository.save(any(Notification.class)))
                    .willReturn(testNotification);

            NotificationMessage message1 = createNotificationMessage(1L, 100L, "첫 번째 알림", 101L, NotificationType.BOOKING_REQUEST);
            NotificationMessage message2 = createNotificationMessage(2L, 100L, "두 번째 알림", 102L, NotificationType.SWAP_ACCEPTED);
            NotificationMessage message3 = createNotificationMessage(3L, 100L, "세 번째 알림", 103L, NotificationType.CHECK_IN);

            // When
            inputDestination.send(MessageBuilder.withPayload(message1).build(), "notification");
            inputDestination.send(MessageBuilder.withPayload(message2).build(), "notification");
            inputDestination.send(MessageBuilder.withPayload(message3).build(), "notification");

            // Then
            await().pollDelay(1, TimeUnit.SECONDS)
                    .atMost(10, TimeUnit.SECONDS)
                    .untilAsserted(() -> {
                        verify(userRepository, times(6)).findById(anyLong());
                        verify(notificationMongoRepository, times(3)).save(any(Notification.class));
                        verify(pushNotificationService, times(3))
                                .sendPushNotificationToUser(anyLong(), any(), any(), any(), anyLong());
                    });
        }

        @Test
        @DisplayName("동일한 사용자의 중복 메시지 수신 시 각 메시지가 독립적으로 처리되어 저장되고 FCM도 각각 전송된다")
        @Timeout(10)
        void shouldHandleDuplicateRequestsFromSameUser() {

            // Given
            given(userRepository.findById(1L)).willReturn(Optional.of(testUser));
            given(userRepository.findById(2L)).willReturn(Optional.of(testUser));

            given(notificationMongoRepository.save(any(Notification.class)))
                    .willReturn(testNotification);

            // When
            inputDestination.send(MessageBuilder.withPayload(testBookingNotificationMessage).build(), "notification");
            inputDestination.send(MessageBuilder.withPayload(testBookingNotificationMessage).build(), "notification");
            inputDestination.send(MessageBuilder.withPayload(testBookingNotificationMessage).build(), "notification");

            // Then
            await().pollDelay(1, TimeUnit.SECONDS)
                    .atMost(8, TimeUnit.SECONDS)
                    .untilAsserted(() -> {
                        verify(userRepository, times(3)).findById(1L);
                        verify(notificationMongoRepository, times(3)).save(any(Notification.class));
                        verify(pushNotificationService, times(3))
                                .sendPushNotificationToUser(anyLong(), any(), any(), any(), anyLong());
                    });
        }
    }

    @Nested
    @DisplayName("알림 객체 생성 및 검증 테스트")
    class NotificationCreationTests {

        @Test
        @DisplayName("알림 객체 생성 시 메시지 필드가 모두 정확하게 복사되고 새 알림은 읽지 않은 상태이다")
        void shouldCreateCorrectNotificationTypeBasedOnMessage() {

            // Given
            given(userRepository.findById(1L)).willReturn(Optional.of(testUser));
            given(userRepository.findById(2L)).willReturn(Optional.of(testUser));

            ArgumentCaptor<Notification> notificationCaptor = ArgumentCaptor.forClass(Notification.class);
            given(notificationMongoRepository.save(notificationCaptor.capture()))
                    .willReturn(testNotification);

            // When
            notificationConsumer.processNotification(testBookingNotificationMessage);

            // Then
            verify(notificationMongoRepository, times(1)).save(any(Notification.class));

            Notification savedNotification = notificationCaptor.getValue();
            assertThat(savedNotification.getSenderId()).isEqualTo(testBookingNotificationMessage.getSenderId());
            assertThat(savedNotification.getRecipientId()).isEqualTo(testBookingNotificationMessage.getRecipientId());
            assertThat(savedNotification.getTitle()).isEqualTo(testBookingNotificationMessage.getTitle());
            assertThat(savedNotification.getContent()).isEqualTo(testBookingNotificationMessage.getContent());
            assertThat(savedNotification.getType()).isEqualTo(testBookingNotificationMessage.getType());
            assertThat(savedNotification.getReferenceId()).isEqualTo(testBookingNotificationMessage.getReferenceId());
            assertThat(savedNotification.isRead()).isFalse();
            assertThat(savedNotification.getCreatedAt()).isNotNull();
            assertThat(savedNotification.getLastUpdatedAt()).isNotNull();
        }
    }

    private NotificationMessage createNotificationMessage(Long senderId, Long recipientId, String content, Long referenceId, NotificationType type) {
        return NotificationMessage.builder()
                .senderId(senderId)
                .recipientId(recipientId)
                .title("테스트 알림")
                .content(content)
                .type(type)
                .referenceId(referenceId)
                .occurredAt(Instant.now())
                .build();
    }

}