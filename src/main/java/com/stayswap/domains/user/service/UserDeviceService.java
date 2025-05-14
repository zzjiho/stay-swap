package com.stayswap.domains.user.service;

import com.stayswap.domains.user.model.dto.request.DeviceRegistrationRequest;
import com.stayswap.domains.user.model.entity.User;
import com.stayswap.domains.user.model.entity.UserDevice;
import com.stayswap.domains.user.repository.UserDeviceRepository;
import com.stayswap.domains.user.repository.UserRepository;
import com.stayswap.global.error.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static com.stayswap.global.code.ErrorCode.NOT_EXISTS_USER;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class UserDeviceService {

    private final UserRepository userRepository;
    private final UserDeviceRepository userDeviceRepository;

    /**
     * 사용자 디바이스 등록
     */
    public void registerDevice(Long userId, DeviceRegistrationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));

        // FCM 토큰이 이미 등록되어 있는지 확인
        Optional<UserDevice> existingDevice = userDeviceRepository.findByFcmToken(request.getFcmToken());

        if (existingDevice.isPresent()) {
            UserDevice device = existingDevice.get();
            // 다른 사용자의 디바이스였다면 현재 사용자로 변경
            if (!device.getUser().getId().equals(userId)) {
                // 기존 디바이스 비활성화
                device.deactivate();
                
                // 새 디바이스로 등록
                createNewDevice(user, request);
            }
            // 같은 사용자의 디바이스라면 정보 업데이트
            else {
                // FCM 토큰이 같으므로 디바이스 정보만 업데이트
                device.updateFcmToken(request.getFcmToken());
            }
        } else {
            // 새 디바이스 등록
            createNewDevice(user, request);
        }
        log.info("사용자 디바이스 등록 완료: userId={}, deviceType={}", userId, request.getDeviceType());
    }

    /**
     * 새 디바이스 생성 및 저장
     */
    private UserDevice createNewDevice(User user, DeviceRegistrationRequest request) {
        UserDevice newDevice = UserDevice.builder()
                .user(user)
                .deviceType(request.getDeviceType())
                .deviceModel(request.getDeviceModel())
                .fcmToken(request.getFcmToken())
                .deviceId(request.getDeviceId())
                .build();
        
        return userDeviceRepository.save(newDevice);
    }

    /**
     * 사용자의 모든 활성 디바이스 FCM 토큰 조회
     */
    @Transactional(readOnly = true)
    public List<String> getActiveFcmTokensByUserId(Long userId) {
        List<UserDevice> devices = userDeviceRepository.findActiveDevicesByUserId(userId);
        return devices.stream()
                .map(UserDevice::getFcmToken)
                .toList();
    }

    /**
     * FCM 토큰 비활성화
     */
    public void deactivateToken(String fcmToken) {
        userDeviceRepository.findByFcmToken(fcmToken)
                .ifPresent(UserDevice::deactivate);
    }
} 