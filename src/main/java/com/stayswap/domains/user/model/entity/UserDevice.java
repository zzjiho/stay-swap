package com.stayswap.domains.user.model.entity;

import com.stayswap.domains.common.entity.BaseTimeEntity;
import com.stayswap.domains.user.constant.DeviceType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Table(name = "user_device")
public class UserDevice extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false)
    private String deviceId;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeviceType deviceType;
    
    @Column(nullable = false)
    private String fcmToken;
    
    @Column
    private String deviceName;
    
    public void updateFcmToken(String fcmToken) {
        this.fcmToken = fcmToken;
    }
} 