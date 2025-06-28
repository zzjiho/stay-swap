package com.stayswap.notification.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "알림 설정 조회 응답")
public class NotificationSettingsResponse {
    
    @Schema(description = "푸시 알림 허용 여부", example = "true")
    private Boolean pushNotificationEnabled;
    
    @Schema(description = "사용자 ID", example = "1")
    private Long userId;
    
    public static NotificationSettingsResponse of(Long userId, Boolean pushNotificationEnabled) {
        return NotificationSettingsResponse.builder()
                .userId(userId)
                .pushNotificationEnabled(pushNotificationEnabled)
                .build();
    }
} 