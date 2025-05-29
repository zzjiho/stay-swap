package com.stayswap.notification.repository;

import com.stayswap.notification.model.document.NotificationDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationMongoRepository extends MongoRepository<NotificationDocument, String> {
    
    Page<NotificationDocument> findByRecipientIdOrderByCreatedAtDesc(Long recipientId, Pageable pageable);
    
    List<NotificationDocument> findByRecipientIdAndIsReadOrderByCreatedAtDesc(Long recipientId, boolean isRead);
    
    long countByRecipientIdAndIsRead(Long recipientId, boolean isRead);
} 