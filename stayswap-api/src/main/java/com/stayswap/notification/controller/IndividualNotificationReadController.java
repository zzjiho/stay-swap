package com.stayswap.notification.controller;

import com.stayswap.common.resolver.userinfo.UserInfo;
import com.stayswap.common.resolver.userinfo.UserInfoDto;
import com.stayswap.model.RestApiResponse;
import com.stayswap.notification.service.reader.IndividualNotificationReadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "개별 알림 읽음 처리", description = "개별 알림의 읽음 상태를 관리하는 API")
public class IndividualNotificationReadController {

    private final IndividualNotificationReadService individualNotificationReadService;

    @Operation(
        summary = "개별 알림 읽음 처리", 
        description = "특정 알림을 읽음 상태로 변경합니다. 이미 읽은 알림을 다시 호출해도 문제없습니다."
    )
    @PostMapping("/{notificationId}/read")
    public RestApiResponse<Void> markNotificationAsRead(
            @PathVariable("notificationId") String notificationId,
            @UserInfo UserInfoDto userInfo) {
        
        log.info("개별 알림 읽음 처리 요청: userId={}, notificationId={}", 
            userInfo.getUserId(), notificationId);
        
        individualNotificationReadService.markAsRead(userInfo.getUserId(), notificationId);
        
        log.info("개별 알림 읽음 처리 성공: userId={}, notificationId={}", 
            userInfo.getUserId(), notificationId);
        
        return RestApiResponse.success(null);
    }

} 