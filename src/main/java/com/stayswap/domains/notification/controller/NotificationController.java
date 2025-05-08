package com.stayswap.domains.notification.controller;

import com.stayswap.domains.notification.model.dto.request.UpdateFcmTokenRequest;
import com.stayswap.domains.notification.model.dto.response.NotificationResponse;
import com.stayswap.domains.notification.service.NotificationService;
import com.stayswap.domains.user.model.entity.User;
import com.stayswap.domains.user.repository.UserRepository;
import com.stayswap.global.error.exception.NotFoundException;
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

import static com.stayswap.global.code.ErrorCode.NOT_EXISTS_USER;

@Tag(name = "알림 API", description = "알림 관련 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @Operation(summary = "FCM 토큰 업데이트", description = "사용자의 FCM 토큰을 업데이트합니다.")
    @PutMapping("/fcm-token")
    public ResponseEntity<Void> updateFcmToken(
            @UserInfo UserInfoDto userInfo,
            @RequestBody UpdateFcmTokenRequest request) {
        
        User user = userRepository.findById(userInfo.getUserId())
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));
        
        user.updateFcmToken(request.getFcmToken());
        userRepository.save(user);
        
        return ResponseEntity.ok().build();
    }

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
}