package com.stayswap.notification.repository;

import com.stayswap.notification.document.FailedNotification;
import com.stayswap.notification.document.FailedNotification.FailureType;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FailedNotificationRepository extends MongoRepository<FailedNotification, String> {

    List<FailedNotification> findByRetried(boolean retried);

    List<FailedNotification> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    List<FailedNotification> findByOriginalTopicAndRetried(String originalTopic, boolean retried);

    List<FailedNotification> findByFailureType(FailureType failureType);

    List<FailedNotification> findByFailureTypeAndRetried(FailureType failureType, boolean retried);

    long countByFailureType(FailureType failureType);

    long countByRetried(boolean retried);
}