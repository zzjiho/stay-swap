package com.stayswap.notification.repository;

import com.stayswap.notification.document.Notification;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationMongoRepository extends MongoRepository<Notification, String> {
    Slice<Notification> findAllByRecipientIdOrderByOccurredAtDesc(Long recipientId, Pageable page);
    Slice<Notification> findAllByRecipientIdAndOccurredAtLessThanOrderByOccurredAtDesc(Long recipientId, Instant occurredAt, Pageable pageable);
    Optional<Notification> findFirstByRecipientIdOrderByLastUpdatedAtDesc(Long recipientId);
    List<Notification> findTop100ByRecipientIdOrderByOccurredAtDesc(Long recipientId);
}