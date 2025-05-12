package com.stayswap.domains.notification.controller;

import com.stayswap.domains.notification.model.dto.response.NotificationResponse;
import com.stayswap.domains.notification.service.NotificationService;
import com.stayswap.domains.user.model.dto.request.DeviceRegistrationRequest;
import com.stayswap.domains.user.service.UserDeviceService;
import com.stayswap.resolver.userinfo.UserInfo;
import com.stayswap.resolver.userinfo.UserInfoDto;
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

    private final NotificationService notificationService;
    private final UserDeviceService userDeviceService;

    @Operation(summary = "알림 목록 조회", description = "사용자의 알림 목록을 조회합니다.")
    @GetMapping
    public ResponseEntity<Page<NotificationResponse>> getNotifications(
            @UserInfo UserInfoDto userInfo,
            @PageableDefault(size = 10) Pageable pageable) {
        
        Page<NotificationResponse> notifications = notificationService.getNotifications(userInfo.getUserId(), pageable);
        return ResponseEntity.ok(notifications);
    }

    @Operation(summary = "알림 읽음 처리", description = "알림을 읽음 처리합니다.")
    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @UserInfo UserInfoDto userInfo,
            @PathVariable Long notificationId) {
        
        NotificationResponse response = notificationService.markAsRead(notificationId, userInfo.getUserId());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "읽지 않은 알림 개수", description = "읽지 않은 알림 개수를 조회합니다.")
    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(@UserInfo UserInfoDto userInfo) {
        long count = notificationService.countUnreadNotifications(userInfo.getUserId());
        return ResponseEntity.ok(count);
    }
}