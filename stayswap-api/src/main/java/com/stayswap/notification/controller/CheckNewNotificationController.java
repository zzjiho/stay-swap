package com.stayswap.notification.controller;

import com.stayswap.common.resolver.userinfo.UserInfo;
import com.stayswap.common.resolver.userinfo.UserInfoDto;
import com.stayswap.model.RestApiResponse;
import com.stayswap.notification.model.dto.response.CheckNewNotificationResponse;
import com.stayswap.notification.service.reader.CheckNewNotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "알림 API", description = "알림 관련 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notifications/new")
public class CheckNewNotificationController {

    private final CheckNewNotificationService checkNewNotificationService;

    @Operation(summary = "새 알림 여부 확인", description = "사용자에게 읽지 않은 새 알림이 있는지 확인합니다.")
    @GetMapping
    public RestApiResponse<CheckNewNotificationResponse> checkNewNotification(@UserInfo UserInfoDto userInfo) {
        boolean hasNew = checkNewNotificationService.checkNewNotification(userInfo.getUserId());
        return RestApiResponse.success(new CheckNewNotificationResponse(hasNew));
    }
} 