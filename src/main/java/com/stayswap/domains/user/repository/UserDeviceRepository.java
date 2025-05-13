package com.stayswap.domains.user.repository;

import com.stayswap.domains.user.model.entity.User;
import com.stayswap.domains.user.model.entity.UserDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserDeviceRepository extends JpaRepository<UserDevice, Long> {
    List<UserDevice> findByUser(User user);

    /**
     * 사용자 ID와 FCM 토큰으로 디바이스 찾기
     */
    Optional<UserDevice> findByUserIdAndFcmToken(Long userId, String fcmToken);

    /**
     * FCM 토큰으로 디바이스 찾기
     */
    Optional<UserDevice> findByFcmToken(String fcmToken);

    /**
     * 사용자의 모든 활성 디바이스 찾기
     */
    List<UserDevice> findByUserAndIsActiveTrue(User user);

    /**
     * 사용자 ID로 모든 활성 디바이스 찾기
     */
    @Query("SELECT ud FROM UserDevice ud WHERE ud.user.id = :userId AND ud.isActive = true")
    List<UserDevice> findActiveDevicesByUserId(@Param("userId") Long userId);
} 