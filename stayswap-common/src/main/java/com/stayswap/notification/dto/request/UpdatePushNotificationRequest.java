package com.stayswap.notification.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "푸시 알림 설정 변경 요청")
public class UpdatePushNotificationRequest {
    
    @NotNull(message = "푸시 알림 허용 여부는 필수입니다.")
    @Schema(description = "푸시 알림 허용 여부", example = "true", required = true)
    private Boolean pushNotificationEnabled;
} 