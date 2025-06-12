package com.stayswap.notification.repository;

import com.stayswap.notification.document.FailedNotification;
import com.stayswap.notification.document.FailedNotification.FailureType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FailedNotificationRepository extends MongoRepository<FailedNotification, String> {

    /**
     * 재시도되지 않았고, 재시도 횟수가 특정 값보다 작은 실패 메시지 조회
     */
    List<FailedNotification> findByRetriedFalseAndRetryCountLessThan(int maxRetryCount, Pageable pageable);
    
    /**
     * 재시도되지 않았고, 재시도 횟수가 특정 값보다 작은 실패 메시지 조회 (배치 처리용)
     */
    default List<FailedNotification> findByRetriedFalseAndRetryCountLessThan(int maxRetryCount, int limit) {
        return findByRetriedFalseAndRetryCountLessThan(maxRetryCount, Pageable.ofSize(limit));
    }

    /**
     * 특정 날짜 이전에 생성되고 재시도된 메시지 삭제
     */
    long deleteByRetriedTrueAndCreatedAtBefore(LocalDateTime dateTime);
}