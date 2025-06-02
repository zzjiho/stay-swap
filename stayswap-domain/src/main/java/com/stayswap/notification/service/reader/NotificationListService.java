package com.stayswap.notification.service.reader;

import com.stayswap.error.exception.NotFoundException;
import com.stayswap.notification.model.document.Notification;
import com.stayswap.notification.model.dto.response.NotificationListResponse;
import com.stayswap.notification.model.dto.response.NotificationResponse;
import com.stayswap.notification.repository.NotificationMongoRepository;
import com.stayswap.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

import static com.stayswap.code.ErrorCode.NOT_EXISTS_USER;


@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationListService {

    private final NotificationMongoRepository notificationMongoRepository;
    private final UserRepository userRepository;

    private static final int PAGE_SIZE = 3;

    /**
     * 사용자 알림 목록 조회
     */
    public NotificationListResponse getUserNotificationsByPivot(Long userId, Instant pivot) {
        userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));

        GetUserNotificationsByPivotResult result = getNotificationsByPivot(userId, pivot);
        
        List<NotificationResponse> notificationResponses = result.getNotifications().stream()
                .map(NotificationResponse::from)
                .collect(Collectors.toList());
        
        Instant nextPivot = null;
        if (result.isHasNext() && !notificationResponses.isEmpty()) {
            nextPivot = notificationResponses.get(notificationResponses.size() - 1).getOccurredAt();
        }
        
        return NotificationListResponse.builder()
                .notifications(notificationResponses)
                .hasNext(result.isHasNext())
                .pivot(nextPivot)
                .build();
    }

    private GetUserNotificationsByPivotResult getNotificationsByPivot(Long userId, Instant pivot) {
        Slice<Notification> result;
        if (pivot == null) {
            // 최신 알림 조회
            result = notificationMongoRepository.findAllByRecipientIdOrderByOccurredAtDesc(
                    userId, PageRequest.of(0, PAGE_SIZE));
        } else {
            // pivot 시간 이전의 알림 조회
            result = notificationMongoRepository.findAllByRecipientIdAndOccurredAtLessThanOrderByOccurredAtDesc(
                    userId, pivot, PageRequest.of(0, PAGE_SIZE));
        }

        List<Notification> notifications = result.getContent();
        boolean hasNext = result.hasNext();

        return new GetUserNotificationsByPivotResult(notifications, hasNext);
    }
    
    /**
     * 알림 목록 조회 결과
     */
    @Getter
    public static class GetUserNotificationsByPivotResult {
        private final List<Notification> notifications;
        private final boolean hasNext;
        
        public GetUserNotificationsByPivotResult(List<Notification> notifications, boolean hasNext) {
            this.notifications = notifications;
            this.hasNext = hasNext;
        }
    }
}