package com.stayswap.notification.controller;

import com.stayswap.common.resolver.userinfo.UserInfo;
import com.stayswap.common.resolver.userinfo.UserInfoDto;
import com.stayswap.model.RestApiResponse;
import com.stayswap.notification.model.dto.response.SetLastReadAtResponse;
import com.stayswap.notification.service.reader.LastReadAtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@Tag(name = "알림 API", description = "알림 관련 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notifications/read")
public class NotificationReadController {

    private final LastReadAtService lastReadAtService;

    @Operation(summary = "알림 읽음 처리", description = "현재 시간을 사용자의 마지막 알림 읽은 시간으로 Redis에 저장합니다.")
    @PostMapping
    public RestApiResponse<SetLastReadAtResponse> setLastReadAt(@UserInfo UserInfoDto userInfo) {
        Instant lastReadAt = lastReadAtService.setLastReadAt(userInfo.getUserId());
        return RestApiResponse.success(new SetLastReadAtResponse(lastReadAt));
    }
} 