package com.stayswap.notification.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "새 알림 여부 확인 응답")
public class CheckNewNotificationResponse {
    
    @Schema(description = "새 알림 존재 여부")
    private boolean hasNew;
} 