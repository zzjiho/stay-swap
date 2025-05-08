package com.stayswap.domains.user.controller;

import com.stayswap.domains.user.model.dto.request.DeviceRegistrationRequest;
import com.stayswap.domains.user.service.UserDeviceService;
import com.stayswap.resolver.userinfo.UserInfo;
import com.stayswap.resolver.userinfo.UserInfoDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "사용자 기기 API", description = "사용자 기기 관련 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users/devices")
public class UserDeviceController {

    private final UserDeviceService userDeviceService;

    @Operation(summary = "기기 등록", description = "사용자 기기와 FCM 토큰을 등록합니다. " +
            "첫 로그인시 기기별 FCM 토큰을 등록합니다.")
    @PostMapping
    public ResponseEntity<Void> registerDevice(
            @UserInfo UserInfoDto userInfo,
            @RequestBody DeviceRegistrationRequest request) {
        
        userDeviceService.registerDevice(userInfo.getUserId(), request);
        return ResponseEntity.ok().build();
    }
} 