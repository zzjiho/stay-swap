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

import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static com.stayswap.code.ErrorCode.NOT_EXISTS_USER;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.awaitility.Awaitility.await;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@DisplayName("좋아요 알림 Consumer 테스트")
class LikeNotificationConsumerTest extends ConsumerIntegrationTest {

    @Autowired
    private InputDestination inputDestination;

    @Autowired
    private LikeNotificationConsumer likeNotificationConsumer;

    private User testUser;
    private NotificationMessage testLikeMessage;
    private Notification testNotification;

    @BeforeEach
    void setUp() {
        reset(userRepository, notificationMongoRepository);

        testUser = User.builder()
                .id(1L)
                .email("sender@example.com")
                .nickname("테스트유저")
                .build();

        testLikeMessage = NotificationMessage.builder()
                .senderId(1L)
                .recipientId(2L)
                .title("좋아요 알림")
                .content("누군가 당신의 집을 좋아해요")
                .type(NotificationType.LIKE_ADDED)
                .referenceId(100L)
                .build();

        testNotification = Notification.of(testLikeMessage);
    }

    @Nested
    @DisplayName("정상 처리 테스트")
    class SuccessfulProcessingTests {
        
        @Test
        @DisplayName("InputDestination으로 좋아요 알림 메시지 전송 시 메시지가 정상 처리되어 MongoDB에 저장된다")
        @Timeout(10)
        void shouldProcessLikeNotificationSuccessfully_WithInputDestination() {

            // Given
            given(userRepository.findById(1L))
                    .willReturn(Optional.of(testUser));
            given(notificationMongoRepository.save(any(Notification.class)))
                    .willReturn(testNotification);

            Message<NotificationMessage> message = MessageBuilder
                    .withPayload(testLikeMessage)
                    .setHeader("messageId", "test-123")
                    .build();

            // When
            inputDestination.send(message, "likeNotification");

            // Then
            await().pollDelay(500, TimeUnit.MILLISECONDS) // pollDelay()로 spring cloud stream이 메시지 처리할 시간을 주자!
                    .atMost(5, TimeUnit.SECONDS) // atMost(): 성공할때까지 기다림
                    .untilAsserted(() -> {
                        verify(userRepository, times(1)).findById(1L);
                        verify(notificationMongoRepository, times(1)).save(any(Notification.class));
                    });
        }

        @Test
        @DisplayName("좋아요 알림 메시지 직접 처리 시 사용자 조회 및 MongoDB 저장이 정상 수행된다")
        @Timeout(5)
        void shouldProcessLikeNotificationSuccessfully_DirectCall() {

            // Given
            given(userRepository.findById(1L))
                    .willReturn(Optional.of(testUser));
            given(notificationMongoRepository.save(any(Notification.class)))
                    .willReturn(testNotification);

            // When
            likeNotificationConsumer.processLikeNotification(testLikeMessage);

            // Then
            verify(userRepository, times(1)).findById(1L);
            verify(notificationMongoRepository, times(1)).save(any(Notification.class));
        }

        @Test
        @DisplayName("Consumer Bean 함수 직접 호출 시 메시지가 정상적으로 처리된다")
        @Timeout(5)
        void shouldConsumerBeanWorkCorrectly() {

            // Given
            given(userRepository.findById(1L))
                    .willReturn(Optional.of(testUser));
            given(notificationMongoRepository.save(any(Notification.class)))
                    .willReturn(testNotification);

            // When
            var consumer = likeNotificationConsumer.likeNotification();
            consumer.accept(testLikeMessage);

            // Then
            verify(userRepository, times(1)).findById(1L);
            verify(notificationMongoRepository, times(1)).save(any(Notification.class));
        }
        
        @Test
        @DisplayName("헤더를 포함한 메시지 전송 시 헤더 정보와 함께 메시지가 정상 처리된다")
        @Timeout(10)
        void shouldProcessMessageWithHeaders() {

            // Given
            given(userRepository.findById(1L))
                    .willReturn(Optional.of(testUser));
            given(notificationMongoRepository.save(any(Notification.class)))
                    .willReturn(testNotification);

            Message<NotificationMessage> message = MessageBuilder
                    .withPayload(testLikeMessage)
                    .setHeader("messageId", "test-header-123")
                    .setHeader("source", "test-system")
                    .setHeader("version", "1.0")
                    .build();

            // When
            inputDestination.send(message, "likeNotification");

            // Then
            await().pollDelay(500, TimeUnit.MILLISECONDS)
                    .atMost(5, TimeUnit.SECONDS)
                    .untilAsserted(() -> {
                        verify(userRepository, times(1)).findById(1L);
                        verify(notificationMongoRepository, times(1)).save(any(Notification.class));
                    });
        }
    }
    
    @Nested
    @DisplayName("예외 처리 테스트")
    class ExceptionHandlingTests {
        
        @Test
        @DisplayName("존재하지 않는 사용자 ID로 메시지 전송 시 알림이 저장되지 않고 예외 처리된다")
        @Timeout(10)
        void shouldHandleUserNotFoundExceptionGracefully_WithInputDestination() {

            // Given
            given(userRepository.findById(1L))
                    .willReturn(Optional.empty());

            Message<NotificationMessage> message = MessageBuilder
                    .withPayload(testLikeMessage)
                    .build();

            // When
            inputDestination.send(message, "likeNotification");

            // Then
            await().pollDelay(1, TimeUnit.SECONDS)
                    .atMost(10, TimeUnit.SECONDS)
                    .untilAsserted(() -> {
                        verify(userRepository, times(1)).findById(1L);
                        verify(notificationMongoRepository, never()).save(any(Notification.class));
                    });
        }

        @Test
        @DisplayName("존재하지 않는 사용자 ID로 직접 메서드 호출 시 NOT_EXISTS_USER 예외가 발생한다")
        @Timeout(5)
        void shouldHandleUserNotFoundExceptionGracefully_DirectCall() {

            // Given
            given(userRepository.findById(1L))
                    .willReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() ->
                    likeNotificationConsumer.processLikeNotification(testLikeMessage))
                    .isInstanceOf(NotFoundException.class)
                    .hasFieldOrPropertyWithValue("errorCode", NOT_EXISTS_USER);

            verify(userRepository, times(1)).findById(1L);
            verify(notificationMongoRepository, never()).save(any(Notification.class));
        }

        @Test
        @DisplayName("MongoDB 저장 실패 시 RuntimeException이 발생하고 예외 메시지가 정확히 전달된다")
        @Timeout(5)
        void shouldHandleMongoSaveException() {

            // Given
            given(userRepository.findById(1L)).willReturn(Optional.of(testUser));
            given(notificationMongoRepository.save(any(Notification.class)))
                    .willThrow(new RuntimeException("MongoDB 연결 실패"));

            // When & Then
            assertThatThrownBy(() ->
                    likeNotificationConsumer.processLikeNotification(testLikeMessage))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("MongoDB 연결 실패");

            verify(userRepository, times(1)).findById(1L);
            verify(notificationMongoRepository, times(1)).save(any(Notification.class));
        }
        
        @Test
        @DisplayName("null senderId를 가진 메시지 처리 시 예외가 발생하고 알림이 저장되지 않는다")
        @Timeout(5)
        void shouldHandleInvalidMessage() {

            // Given
            NotificationMessage invalidMessage = NotificationMessage.builder()
                    .senderId(null)
                    .recipientId(2L)
                    .title("잘못된 메시지")
                    .content("senderId가 null인 메시지")
                    .type(NotificationType.LIKE_ADDED)
                    .build();

            // When & Then
            inputDestination.send(
                    MessageBuilder.withPayload(invalidMessage).build(),
                    "likeNotification"
            );

            await().pollDelay(1, TimeUnit.SECONDS)
                    .during(3, TimeUnit.SECONDS) // during(): ~초 동안 감시하겠다
                    .untilAsserted(() -> {
                        verify(notificationMongoRepository, never()).save(any(Notification.class));
                    });
        }
    }
    
    @Nested
    @DisplayName("다중 메시지 처리 테스트")
    class MultipleMessageTests {
        
        @Test
        @DisplayName("여러 메시지 순차적 전송 시 모든 메시지가 독립적으로 처리되어 저장된다")
        @Timeout(15)
        void shouldProcessMultipleMessagesSequentially() {

            // Given
            User user1 = User.builder().id(1L).email("user1@test.com").build();
            User user2 = User.builder().id(2L).email("user2@test.com").build();
            User user3 = User.builder().id(3L).email("user3@test.com").build();

            given(userRepository.findById(1L)).willReturn(Optional.of(user1));
            given(userRepository.findById(2L)).willReturn(Optional.of(user2));
            given(userRepository.findById(3L)).willReturn(Optional.of(user3));
            given(notificationMongoRepository.save(any(Notification.class)))
                    .willReturn(testNotification);

            NotificationMessage message1 = createLikeMessage(1L, "첫 번째 좋아요", 101L);
            NotificationMessage message2 = createLikeMessage(2L, "두 번째 좋아요", 102L);
            NotificationMessage message3 = createLikeMessage(3L, "세 번째 좋아요", 103L);

            // When
            inputDestination.send(MessageBuilder.withPayload(message1).build(), "likeNotification");
            inputDestination.send(MessageBuilder.withPayload(message2).build(), "likeNotification");
            inputDestination.send(MessageBuilder.withPayload(message3).build(), "likeNotification");

            // Then
            await().pollDelay(1, TimeUnit.SECONDS)
                    .atMost(10, TimeUnit.SECONDS)
                    .untilAsserted(() -> {
                        verify(userRepository, times(3)).findById(anyLong());
                        verify(notificationMongoRepository, times(3)).save(any(Notification.class));
                    });
        }
        
        @Test
        @DisplayName("다양한 좋아요 타입 메시지 전송 시 모든 타입의 메시지가 정상 처리된다")
        @Timeout(10)
        void shouldProcessDifferentLikeMessageTypes() {

            // Given
            given(userRepository.findById(anyLong()))
                    .willReturn(Optional.of(testUser));
            given(notificationMongoRepository.save(any(Notification.class)))
                    .willReturn(testNotification);

            NotificationMessage postLike = NotificationMessage.builder()
                    .senderId(1L)
                    .recipientId(2L)
                    .title("게시물 좋아요")
                    .content("누군가 당신의 집을 좋아해요")
                    .type(NotificationType.LIKE_ADDED)
                    .referenceId(100L)
                    .build();

            // When
            inputDestination.send(
                    MessageBuilder.withPayload(postLike).build(),
                    "likeNotification"
            );

            // Then
            await().pollDelay(500, TimeUnit.MILLISECONDS)
                    .atMost(5, TimeUnit.SECONDS)
                    .untilAsserted(() -> {
                        verify(userRepository, times(1)).findById(1L);
                        verify(notificationMongoRepository, times(1)).save(any(Notification.class));
                    });
        }
        
        @Test
        @DisplayName("동일한 사용자의 중복 메시지 수신 시 각 메시지가 독립적으로 처리되어 저장된다")
        @Timeout(10)
        void shouldHandleDuplicateRequestsFromSameUser() {

            // Given
            given(userRepository.findById(1L))
                    .willReturn(Optional.of(testUser));
            given(notificationMongoRepository.save(any(Notification.class)))
                    .willReturn(testNotification);

            // When
            inputDestination.send(MessageBuilder.withPayload(testLikeMessage).build(), "likeNotification");
            inputDestination.send(MessageBuilder.withPayload(testLikeMessage).build(), "likeNotification");
            inputDestination.send(MessageBuilder.withPayload(testLikeMessage).build(), "likeNotification");

            // Then
            await().pollDelay(1, TimeUnit.SECONDS)
                    .atMost(8, TimeUnit.SECONDS)
                    .untilAsserted(() -> {
                        verify(userRepository, times(3)).findById(1L);
                        verify(notificationMongoRepository, times(3)).save(any(Notification.class));
                    });
        }
    }
    
    @Nested
    @DisplayName("알림 객체 생성 및 검증 테스트")
    class NotificationCreationTests {

        @Test
        @DisplayName("알림 객체 생성 시 메시지 필드가 모두 정확하게 복사된다")
        void shouldCreateNotificationCorrectly() {

            // Given
            given(userRepository.findById(1L)).willReturn(Optional.of(testUser));

            ArgumentCaptor<Notification> notificationCaptor = ArgumentCaptor.forClass(Notification.class);
            given(notificationMongoRepository.save(notificationCaptor.capture()))
                    .willReturn(testNotification);

            // When
            likeNotificationConsumer.processLikeNotification(testLikeMessage);

            // Then
            verify(notificationMongoRepository, times(1)).save(any(Notification.class));

            Notification savedNotification = notificationCaptor.getValue();
            assertThat(savedNotification.getSenderId()).isEqualTo(testLikeMessage.getSenderId());
            assertThat(savedNotification.getRecipientId()).isEqualTo(testLikeMessage.getRecipientId());
            assertThat(savedNotification.getTitle()).isEqualTo(testLikeMessage.getTitle());
            assertThat(savedNotification.getContent()).isEqualTo(testLikeMessage.getContent());
            assertThat(savedNotification.getType()).isEqualTo(testLikeMessage.getType());
            assertThat(savedNotification.getReferenceId()).isEqualTo(testLikeMessage.getReferenceId());
            assertThat(savedNotification.isRead()).isFalse();
            assertThat(savedNotification.getCreatedAt()).isNotNull();
            assertThat(savedNotification.getLastUpdatedAt()).isNotNull();
        }
    }

    private NotificationMessage createLikeMessage(Long senderId, String content, Long referenceId) {
        return NotificationMessage.builder()
                .senderId(senderId)
                .recipientId(100L)
                .title("좋아요 알림")
                .content(content)
                .type(NotificationType.LIKE_ADDED)
                .referenceId(referenceId)
                .build();
    }
}