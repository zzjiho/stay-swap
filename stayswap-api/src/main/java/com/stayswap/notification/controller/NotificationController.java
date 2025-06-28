package com.stayswap.notification.controller;

import com.stayswap.common.resolver.userinfo.UserInfo;
import com.stayswap.common.resolver.userinfo.UserInfoDto;
import com.stayswap.model.RestApiResponse;
import com.stayswap.notification.dto.request.UpdatePushNotificationRequest;
import com.stayswap.notification.dto.response.NotificationListResponse;
import com.stayswap.notification.dto.response.NotificationSettingsResponse;
import com.stayswap.notification.service.NotificationSettingsService;
import com.stayswap.notification.service.reader.NotificationListService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@Tag(name = "알림 API", description = "알림 관련 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationListService notificationListService;
    private final NotificationSettingsService notificationSettingsService;

    @Operation(summary = "알림 목록 조회", description = "cursor 기반 페이징으로 사용자의 알림 목록을 조회합니다.")
    @GetMapping
    public RestApiResponse<NotificationListResponse> getNotifications(
            @UserInfo UserInfoDto userInfo,
            @RequestParam(value = "pivot", required = false) Instant pivot) {
        
        NotificationListResponse response =
                notificationListService.getUserNotificationsByPivot(userInfo.getUserId(), pivot);

        return RestApiResponse.success(response);
    }

    @Operation(summary = "푸시알림 여부 조회", description = "사용자의 푸시알림 여부를 조회합니다.")
    @GetMapping("/settings")
    public RestApiResponse<NotificationSettingsResponse> getNotificationSettings(
            @UserInfo UserInfoDto userInfo) {

        NotificationSettingsResponse response = 
                notificationSettingsService.getNotificationSettings(userInfo.getUserId());
        
        return RestApiResponse.success(response);
    }

    @Operation(summary = "푸시 알림 설정 토글", description = "사용자의 푸시 알림 허용/거부 설정을 변경합니다.")
    @PostMapping("/settings/push")
    public RestApiResponse<NotificationSettingsResponse> togglePushNotificationSettings(
            @UserInfo UserInfoDto userInfo) {
        
        NotificationSettingsResponse response = 
                notificationSettingsService.togglePushNotificationSettings(userInfo.getUserId());
        
        return RestApiResponse.success(response);
    }

}