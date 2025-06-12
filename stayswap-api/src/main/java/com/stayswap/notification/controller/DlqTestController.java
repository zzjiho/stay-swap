package com.stayswap.notification.controller;

import com.stayswap.notification.constant.NotificationType;
import com.stayswap.notification.dto.request.NotificationMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.stream.function.StreamBridge;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/test/dlq")
@RequiredArgsConstructor
public class DlqTestController {

    private final StreamBridge streamBridge;

    /**
     * 시나리오 1: 존재하지 않는 사용자로 인한 실패
     * Consumer에서 userRepository.findById()가 NotFoundException 발생
     */
    @PostMapping("/user-not-found")
    public ResponseEntity<Map<String, Object>> testUserNotFound() {
        NotificationMessage message = NotificationMessage.builder()
                .recipientId(1L)
                .senderId(999999L)  // 존재하지 않는 사용자 ID
                .type(NotificationType.BOOKING_REQUEST)
                .title("[DLQ 테스트] 존재하지 않는 사용자")
                .content("senderId가 존재하지 않아 실패할 예정입니다.")
                .referenceId(1001L)
                .occurredAt(Instant.now())
                .build();

        boolean sent = streamBridge.send("notification-out-0", message);

        Map<String, Object> response = new HashMap<>();
        response.put("sent", sent);
        response.put("topic", "notification");
        response.put("message", message);
        response.put("expectedError", "NotFoundException: 존재하지 않는 회원입니다.");
        response.put("expectedRetries", 3);
        response.put("expectedDlqTopic", "notification.dlq");

        log.info("DLQ 테스트 메시지 발송 - 존재하지 않는 사용자: {}", message);

        return ResponseEntity.ok(response);
    }

    /**
     * 시나리오 2: MongoDB 저장 실패 시뮬레이션
     * Consumer에서 content가 "FORCE_MONGO_ERROR"인 경우 RuntimeException 발생
     */
    @PostMapping("/mongo-fail")
    public ResponseEntity<Map<String, Object>> testMongoFail() {
        NotificationMessage message = NotificationMessage.builder()
                .recipientId(1L)
                .senderId(1L)  // 존재하는 사용자 (본인)
                .type(NotificationType.BOOKING_REQUEST)
                .title("[DLQ 테스트] MongoDB 실패")
                .content("FORCE_MONGO_ERROR")  // Consumer에서 이 값을 체크해서 에러 발생
                .referenceId(1002L)
                .occurredAt(Instant.now())
                .build();

        boolean sent = streamBridge.send("notification-out-0", message);

        Map<String, Object> response = new HashMap<>();
        response.put("sent", sent);
        response.put("topic", "notification");
        response.put("message", message);
        response.put("expectedError", "RuntimeException: MongoDB 저장 중 에러 발생 (테스트)");
        response.put("expectedBehavior", "첫 번째 단계에서 즉시 실패");

        log.info("DLQ 테스트 메시지 발송 - MongoDB 실패: {}", message);

        return ResponseEntity.ok(response);
    }

    /**
     * 시나리오 3: FCM 푸시 알림 실패 시뮬레이션
     * Consumer에서 content가 "FORCE_FCM_ERROR"인 경우 FCM 단계에서 RuntimeException 발생
     */
    @PostMapping("/fcm-fail")
    public ResponseEntity<Map<String, Object>> testFcmFail() {
        NotificationMessage message = NotificationMessage.builder()
                .recipientId(1L)
                .senderId(1L)  // 존재하는 사용자
                .type(NotificationType.BOOKING_REQUEST)
                .title("[DLQ 테스트] FCM 실패")
                .content("FORCE_FCM_ERROR")  // FCM 에러 유도
                .referenceId(1003L)
                .occurredAt(Instant.now())
                .build();
                
        // 명시적으로 원본 토픽 헤더 추가
        String topic = "notification";
        boolean sent = streamBridge.send("notification-out-0", 
                MessageBuilder.withPayload(message)
                .setHeader("ORIGINAL_TOPIC", topic)
                .setHeader(KafkaHeaders.TOPIC, topic)
                .build());

        Map<String, Object> response = new HashMap<>();
        response.put("sent", sent);
        response.put("topic", topic);
        response.put("message", message);
        response.put("expectedError", "RuntimeException: FCM 푸시 알림 전송 실패 (테스트)");
        response.put("expectedBehavior", "사용자 확인과 MongoDB 저장은 성공, FCM 전송에서 실패");

        log.info("DLQ 테스트 메시지 발송 - FCM 실패: {}", message);

        return ResponseEntity.ok(response);
    }

    /**
     * 시나리오 4: 여러 메시지 한번에 발송 (부하 테스트)
     */
    @PostMapping("/bulk-fail")
    public ResponseEntity<Map<String, Object>> testBulkFail(@RequestParam(defaultValue = "5") int count) {
        int successCount = 0;

        for (int i = 0; i < count; i++) {
            NotificationMessage message = NotificationMessage.builder()
                    .recipientId((long) (i + 1))
                    .senderId(999999L)  // 모두 실패하도록 존재하지 않는 사용자
                    .type(NotificationType.TEST_NOTIFICATION)
                    .title("[DLQ 테스트] 대량 실패 #" + (i + 1))
                    .content("대량 테스트 메시지 " + (i + 1))
                    .referenceId((long) (2000 + i))
                    .occurredAt(Instant.now())
                    .build();

            if (streamBridge.send("notification-out-0", message)) {
                successCount++;
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("totalSent", count);
        response.put("successCount", successCount);
        response.put("info", "모든 메시지가 DLQ로 이동할 예정");

        log.info("DLQ 테스트 대량 메시지 {} 개 발송 완료", count);

        return ResponseEntity.ok(response);
    }

    /**
     * 시나리오 5: 정상 메시지 (비교용)
     */
    @PostMapping("/normal")
    public ResponseEntity<Map<String, Object>> testNormal() {
        NotificationMessage message = NotificationMessage.builder()
                .recipientId(1L)
                .senderId(1L)  // 존재하는 사용자 (자기 자신)
                .type(NotificationType.BOOKING_REQUEST)
                .title("[정상] 숙박 요청")
                .content("정상적으로 처리될 메시지입니다.")
                .referenceId(3000L)
                .occurredAt(Instant.now())
                .build();

        boolean sent = streamBridge.send("notification-out-0", message);

        Map<String, Object> response = new HashMap<>();
        response.put("sent", sent);
        response.put("topic", "notification");
        response.put("message", message);
        response.put("expectedResult", "정상 처리 - MongoDB 저장 및 FCM 전송 성공");

        log.info("정상 메시지 발송: {}", message);

        return ResponseEntity.ok(response);
    }

    /**
     * 시나리오 6: 좋아요 알림 DLQ 테스트
     */
    @PostMapping("/like-notification-fail")
    public ResponseEntity<Map<String, Object>> testLikeNotificationFail() {
        NotificationMessage message = NotificationMessage.builder()
                .recipientId(1L)
                .senderId(999999L)  // 존재하지 않는 사용자
                .type(NotificationType.LIKE_ADDED)
                .title("[DLQ 테스트] 좋아요 알림")
                .content("좋아요 알림 실패 테스트")
                .referenceId(null)
                .accommodationId(100L)
                .accommodationName("테스트 숙소")
                .occurredAt(Instant.now())
                .build();

        boolean sent = streamBridge.send("likeNotification-out-0", message);

        Map<String, Object> response = new HashMap<>();
        response.put("sent", sent);
        response.put("topic", "likeNotification");
        response.put("message", message);
        response.put("expectedDlqTopic", "likeNotification.dlq");

        log.info("DLQ 테스트 메시지 발송 - 좋아요 알림: {}", message);

        return ResponseEntity.ok(response);
    }

    /**
     * 시나리오 7: 모든 실패 유형 조합 테스트
     */
    @PostMapping("/test-all")
    public ResponseEntity<Map<String, Object>> testAll() {
        Map<String, Object> results = new HashMap<>();

        // 1. 사용자 없음 테스트
        NotificationMessage userNotFound = NotificationMessage.builder()
                .recipientId(1L).senderId(999999L)
                .type(NotificationType.TEST_NOTIFICATION)
                .title("[전체테스트] 사용자 없음")
                .content("사용자 없음 테스트")
                .referenceId(9001L)
                .occurredAt(Instant.now())
                .build();
        results.put("userNotFound", streamBridge.send("notification-out-0", userNotFound));

        // 2. MongoDB 실패 테스트
        NotificationMessage mongoFail = NotificationMessage.builder()
                .recipientId(1L).senderId(1L)
                .type(NotificationType.TEST_NOTIFICATION)
                .title("[전체테스트] MongoDB 실패")
                .content("FORCE_MONGO_ERROR")
                .referenceId(9002L)
                .occurredAt(Instant.now())
                .build();
        results.put("mongoFail", streamBridge.send("notification-out-0", mongoFail));

        // 3. FCM 실패 테스트
        NotificationMessage fcmFail = NotificationMessage.builder()
                .recipientId(1L).senderId(1L)
                .type(NotificationType.TEST_NOTIFICATION)
                .title("[전체테스트] FCM 실패")
                .content("FORCE_FCM_ERROR")
                .referenceId(9003L)
                .occurredAt(Instant.now())
                .build();
        results.put("fcmFail", streamBridge.send("notification-out-0", fcmFail));

        // 4. 정상 메시지
        NotificationMessage normal = NotificationMessage.builder()
                .recipientId(1L).senderId(1L)
                .type(NotificationType.TEST_NOTIFICATION)
                .title("[전체테스트] 정상")
                .content("정상 처리 메시지")
                .referenceId(9004L)
                .occurredAt(Instant.now())
                .build();
        results.put("normal", streamBridge.send("notification-out-0", normal));

        Map<String, Object> response = new HashMap<>();
        response.put("results", results);
        response.put("info", "4개 메시지 발송 완료 - 3개는 DLQ로, 1개는 정상 처리 예상");

        log.info("전체 테스트 메시지 발송 완료");

        return ResponseEntity.ok(response);
    }
}