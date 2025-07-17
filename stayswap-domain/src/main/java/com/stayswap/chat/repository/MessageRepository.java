package com.stayswap.chat.repository;

import com.stayswap.chat.model.entity.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {

    Slice<Message> findByChatroomIdOrderByCreatedAtAsc(Long chatroomId, Pageable pageable);

    Boolean existsByChatroomIdAndCreatedAtAfter(Long chatroomId, LocalDateTime createdAt);
    
    Optional<Message> findTopByChatroomIdOrderByCreatedAtDesc(Long chatroomId);
    
    Long countByChatroomIdAndCreatedAtAfter(Long chatroomId, LocalDateTime createdAt);
}
