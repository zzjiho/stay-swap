package com.stayswap.chat.repository;

import com.stayswap.chat.document.FailedChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FailedChatMessageRepository extends MongoRepository<FailedChatMessage, String> {

    /**
     * 재시도되지 않았고 최대 재시도 횟수보다 적은 실패 메시지 조회
     */
    List<FailedChatMessage> findByRetriedFalseAndRetryCountLessThan(int maxRetryCount, int limit);

    /**
     * 재시도 완료된 오래된 실패 메시지 삭제
     */
    long deleteByRetriedTrueAndCreatedAtBefore(LocalDateTime date);

    /**
     * 실패 유형별 조회
     */
    List<FailedChatMessage> findByFailureType(FailedChatMessage.FailureType failureType);

    /**
     * 특정 기간 내 실패 메시지 수 조회
     */
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
} 