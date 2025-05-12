package com.stayswap.domains.user.model.dto.request;

import com.stayswap.domains.user.constant.DeviceType;
import lombok.*;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class DeviceRegistrationRequest {
    private String deviceId;
    private DeviceType deviceType;
    private String fcmToken;
    private String deviceName;
} 