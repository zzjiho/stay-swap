package com.stayswap.domains.user.model.dto.request;

import com.stayswap.domains.user.constant.DeviceType;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Getter
@Setter
@NoArgsConstructor
public class DeviceRegistrationRequest {

    @NotNull(message = "디바이스 유형은 필수입니다")
    private DeviceType deviceType;

    @NotBlank(message = "디바이스 모델은 필수입니다")
    private String deviceModel;

    @NotBlank(message = "FCM 토큰은 필수입니다")
    private String fcmToken;
} 