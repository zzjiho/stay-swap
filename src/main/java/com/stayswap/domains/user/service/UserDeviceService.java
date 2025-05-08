package com.stayswap.domains.user.service;

import com.stayswap.domains.user.model.dto.request.DeviceRegistrationRequest;
import com.stayswap.domains.user.model.entity.User;
import com.stayswap.domains.user.model.entity.UserDevice;
import com.stayswap.domains.user.repository.UserDeviceRepository;
import com.stayswap.domains.user.repository.UserRepository;
import com.stayswap.global.code.ErrorCode;
import com.stayswap.global.error.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class UserDeviceService {

    private final UserRepository userRepository;
    private final UserDeviceRepository userDeviceRepository;

    /**
     * 사용자 기기 등록/업데이트
     */
    public void registerDevice(Long userId, DeviceRegistrationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.NOT_EXISTS_USER));
        
        userDeviceRepository.findByUserAndDeviceId(user, request.getDeviceId())
                .ifPresentOrElse(
                    // 기존 기기 업데이트
                    device -> device.updateFcmToken(request.getFcmToken()),
                    // 새 기기 등록
                    () -> {
                        UserDevice newDevice = UserDevice.builder()
                                .user(user)
                                .deviceId(request.getDeviceId())
                                .deviceType(request.getDeviceType())
                                .fcmToken(request.getFcmToken())
                                .deviceName(request.getDeviceName())
                                .build();
                        
                        userDeviceRepository.save(newDevice);
                    }
                );
    }

    /**
     * 사용자의 모든 FCM 토큰 조회
     */
    @Transactional(readOnly = true)
    public List<String> getUserFcmTokens(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.NOT_EXISTS_USER));
        
        return userDeviceRepository.findByUserAndFcmTokenIsNotNull(user)
                .stream()
                .map(UserDevice::getFcmToken)
                .toList();
    }
} 