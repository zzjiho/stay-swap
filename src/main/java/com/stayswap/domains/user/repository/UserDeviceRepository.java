package com.stayswap.domains.user.repository;

import com.stayswap.domains.user.model.entity.User;
import com.stayswap.domains.user.model.entity.UserDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserDeviceRepository extends JpaRepository<UserDevice, Long> {
    List<UserDevice> findByUser(User user);
    Optional<UserDevice> findByUserAndDeviceId(User user, String deviceId);
    List<UserDevice> findByUserAndFcmTokenIsNotNull(User user);
} 