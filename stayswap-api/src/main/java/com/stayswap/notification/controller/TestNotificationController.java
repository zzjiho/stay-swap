package com.stayswap.notification.controller;

import com.stayswap.common.resolver.userinfo.UserInfo;
import com.stayswap.common.resolver.userinfo.UserInfoDto;
import com.stayswap.model.RestApiResponse;
import com.stayswap.notification.dto.request.TestNotificationRequest;
import com.stayswap.notification.dto.response.NotificationListResponse;
import com.stayswap.notification.service.TestNotificationService;
import com.stayswap.notification.service.reader.NotificationListService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.jmx.export.notification.NotificationPublisher;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@Tag(name = "알림 API", description = "알림 관련 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notifications")
public class TestNotificationController {

    private final TestNotificationService testNotificationService;

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
}