package com.stayswap.notification.service;

import com.stayswap.error.exception.NotFoundException;
import com.stayswap.notification.dto.request.UpdatePushNotificationRequest;
import com.stayswap.notification.dto.response.NotificationSettingsResponse;
import com.stayswap.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.stayswap.code.ErrorCode.NOT_EXISTS_USER;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationSettingsService {

    private final UserRepository userRepository;

    /**
     * 사용자의 알림 설정 조회
     */
    public NotificationSettingsResponse getNotificationSettings(Long userId) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));
        
        return NotificationSettingsResponse.of(userId, user.getPushNotificationYN());
    }

    /**
     * 푸시 알림 설정 변경
     */
    @Transactional
    public NotificationSettingsResponse togglePushNotificationSettings(Long userId) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));
        
        // 현재 상태 반전
        Boolean currentSetting = user.getPushNotificationYN();
        Boolean newSetting = !currentSetting;
        
        user.updatePushNotificationYN(newSetting);
        
        log.info("사용자 푸시 알림 설정 토글: userId={}, {} -> {}", userId, currentSetting, newSetting);
        
        return NotificationSettingsResponse.of(userId, newSetting);
    }
} 