package com.stayswap.user.model.dto.request;

import com.stayswap.user.constant.DeviceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class DeviceRegistrationRequest {

    @NotBlank(message = "디바이스 ID는 필수입니다")
    private String deviceId;

    @NotNull(message = "디바이스 유형은 필수입니다")
    private DeviceType deviceType;

    @NotBlank(message = "디바이스 모델은 필수입니다")
    private String deviceModel;

    @NotBlank(message = "FCM 토큰은 필수입니다")
    private String fcmToken;
} 