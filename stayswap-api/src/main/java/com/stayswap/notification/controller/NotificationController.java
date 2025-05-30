package com.stayswap.notification.controller;

import com.stayswap.notification.model.dto.request.TestNotificationRequest;
import com.stayswap.notification.model.dto.response.NotificationResponse;
import com.stayswap.notification.service.NotificationService;
import com.stayswap.notification.service.TestNotificationService;
import com.stayswap.user.service.UserDeviceService;
import com.stayswap.common.resolver.userinfo.UserInfo;
import com.stayswap.common.resolver.userinfo.UserInfoDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "알림 API", description = "알림 관련 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notifications")
public class NotificationController {

    private final TestNotificationService testNotificationService;

    @Operation(summary = "테스트 알림 전송", description = "자신에게 테스트 알림을 전송합니다. (개발용)")
    @PostMapping("/test")
    public ResponseEntity<String> sendTestNotification(
            @UserInfo UserInfoDto userInfo,
            @RequestBody(required = false) TestNotificationRequest request) {
        
        String title = request != null ? request.getTitle() : null;
        String content = request != null ? request.getContent() : null;

        testNotificationService.createTestNotification(userInfo.getUserId(), title, content);
        return ResponseEntity.ok("테스트 알림이 발송되었습니다.");
    }
}