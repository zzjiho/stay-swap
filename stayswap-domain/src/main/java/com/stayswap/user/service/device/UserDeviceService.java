package com.stayswap.user.service.device;

import com.stayswap.error.exception.NotFoundException;
import com.stayswap.user.model.dto.request.DeviceRegistrationRequest;
import com.stayswap.user.model.entity.User;
import com.stayswap.user.model.entity.UserDevice;
import com.stayswap.user.repository.UserDeviceRepository;
import com.stayswap.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static com.stayswap.code.ErrorCode.NOT_EXISTS_USER;


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
    @Transactional
    public void registerDevice(Long userId, DeviceRegistrationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));

        // 모든 활성 디바이스를 비활성화
        userDeviceRepository.deactivateAllActiveDevicesByUserId(userId);

        Optional<UserDevice> existingDevice = userDeviceRepository.findByFcmToken(request.getFcmToken());

        // FCM 토큰이 같은 디바이스가 이미 등록시
        if (existingDevice.isPresent()) {
            UserDevice device = existingDevice.get();

            // 사용자 정보와 디바이스 정보를 업데이트하고 활성화
            device.updateUserAndDeviceInfo(user, request.getDeviceId(), request.getDeviceModel(), request.getDeviceType());
            device.activate();
            userDeviceRepository.save(device);

            log.info("기존 디바이스 사용자 및 정보 갱신: userId={}, deviceId={}, deviceType={}, fcmToken={}",
                    userId, request.getDeviceId(), request.getDeviceType(), request.getFcmToken());
        } else {
            // 새 디바이스를 생성합니다.
            createNewDevice(user, request);
            log.info("새 디바이스 등록: userId={}, deviceId={}, deviceType={}, fcmToken={}",
                    userId, request.getDeviceId(), request.getDeviceType(), request.getFcmToken());
        }

        log.info("사용자 디바이스 등록 처리 완료: userId={}, deviceType={}", userId, request.getDeviceType());
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