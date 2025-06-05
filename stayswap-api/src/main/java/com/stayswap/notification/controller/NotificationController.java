package com.stayswap.notification.controller;

import com.stayswap.common.resolver.userinfo.UserInfo;
import com.stayswap.common.resolver.userinfo.UserInfoDto;
import com.stayswap.model.RestApiResponse;
import com.stayswap.notification.model.dto.request.TestNotificationRequest;
import com.stayswap.notification.model.dto.response.NotificationListResponse;
import com.stayswap.notification.service.reader.NotificationListService;
import com.stayswap.notification.service.core.NotificationPublisher;
import com.stayswap.notification.service.TestNotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@Tag(name = "알림 API", description = "알림 관련 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notifications")
public class NotificationController {

    private final TestNotificationService testNotificationService;
    private final NotificationPublisher notificationPublisher;
    private final NotificationListService notificationListService;

    @Operation(summary = "테스트 알림 전송", description = "자신에게 테스트 알림을 전송합니다. (개발용)")
    @PostMapping("/test")
    public RestApiResponse<String> sendTestNotification(
            @UserInfo UserInfoDto userInfo,
            @RequestBody(required = false) TestNotificationRequest request) {
        
        String title = request != null ? request.getTitle() : null;
        String content = request != null ? request.getContent() : null;

        testNotificationService.createTestNotification(userInfo.getUserId(), title, content);
        return RestApiResponse.success("테스트 알림이 발송되었습니다.");
    }
    
    @Operation(summary = "알림 목록 조회", description = "cursor 기반 페이징으로 사용자의 알림 목록을 조회합니다.")
    @GetMapping("/{userId}")
    public RestApiResponse<NotificationListResponse> getNotifications(
            @UserInfo UserInfoDto userInfo,
            @RequestParam(value = "pivot", required = false) Instant pivot) {
        
        NotificationListResponse response =
                notificationListService.getUserNotificationsByPivot(userInfo.getUserId(), pivot);

        return RestApiResponse.success(response);
    }
}