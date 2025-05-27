package com.stayswap.user.model.entity;

import com.stayswap.common.entity.BaseTimeEntity;
import com.stayswap.user.constant.DeviceType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_device",
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_user_device_fcm_token", columnNames = "fcm_token")
       })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserDevice extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "device_id", nullable = false)
    private String deviceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "device_type", nullable = false, length = 10)
    private DeviceType deviceType;

    @Column(name = "device_model", nullable = false)
    private String deviceModel;

    @Column(name = "fcm_token", nullable = false, unique = true)
    private String fcmToken;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Builder
    public UserDevice(User user, DeviceType deviceType, String deviceModel, String fcmToken, String deviceId) {
        this.user = user;
        this.deviceType = deviceType;
        this.deviceModel = deviceModel;
        this.fcmToken = fcmToken;
        this.deviceId = deviceId;
    }

    /**
     * 디바이스 비활성화
     */
    public void deactivate() {
        this.isActive = false;
    }

    /**
     * FCM 토큰 업데이트
     */
    public void updateFcmToken(String fcmToken) {
        this.fcmToken = fcmToken;
    }
} 