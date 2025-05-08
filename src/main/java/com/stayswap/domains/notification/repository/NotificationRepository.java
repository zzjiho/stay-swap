package com.stayswap.domains.notification.repository;

import com.stayswap.domains.notification.model.entity.Notification;
import com.stayswap.domains.user.model.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    Page<Notification> findByRecipientOrderByRegTimeDesc(User recipient, Pageable pageable);
    
    List<Notification> findByRecipientAndIsReadOrderByRegTimeDesc(User recipient, boolean isRead);
    
    long countByRecipientAndIsRead(User recipient, boolean isRead);
} 