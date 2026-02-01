package com.stayswap.chat.repository;

import com.stayswap.chat.model.entity.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {

    Slice<Message> findByChatroomIdOrderByCreatedAtAsc(Long chatroomId, Pageable pageable);
    
    Slice<Message> findByChatroomIdOrderByCreatedAtDesc(Long chatroomId, Pageable pageable);

    Boolean existsByChatroomIdAndCreatedAtAfter(Long chatroomId, LocalDateTime createdAt);

    // 특정 사용자가 보낸 메시지 제외하고 새 메시지 존재 여부 확인
    Boolean existsByChatroomIdAndCreatedAtAfterAndUserIdNot(Long chatroomId, LocalDateTime createdAt, Long userId);

    Optional<Message> findTopByChatroomIdOrderByCreatedAtDesc(Long chatroomId);

    Long countByChatroomIdAndCreatedAtAfter(Long chatroomId, LocalDateTime createdAt);

    // 특정 사용자가 보낸 메시지 제외하고 읽지 않은 메시지 수 계산
    Long countByChatroomIdAndCreatedAtAfterAndUserIdNot(Long chatroomId, LocalDateTime createdAt, Long userId);
}
