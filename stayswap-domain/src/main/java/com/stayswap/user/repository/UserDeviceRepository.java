package com.stayswap.user.repository;

import com.stayswap.user.model.entity.UserDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserDeviceRepository extends JpaRepository<UserDevice, Long> {

    /**
     * FCM 토큰으로 디바이스 찾기
     */
    Optional<UserDevice> findByFcmToken(String fcmToken);

    /**
     * 사용자 ID로 모든 활성 디바이스 찾기
     */
    @Query("SELECT ud FROM UserDevice ud WHERE ud.user.id = :userId AND ud.isActive = true")
    List<UserDevice> findActiveDevicesByUserId(@Param("userId") Long userId);

    /**
     * 특정 사용자의 모든 활성 디바이스를 비활성화
     */
    @Modifying
    @Query("UPDATE UserDevice ud SET ud.isActive = false WHERE ud.user.id = :userId AND ud.isActive = true")
    void deactivateAllActiveDevicesByUserId(@Param("userId") Long userId);

} 