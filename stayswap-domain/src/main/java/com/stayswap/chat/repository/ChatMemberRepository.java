package com.stayswap.chat.repository;

import com.stayswap.chat.model.entity.ChatMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

public interface ChatMemberRepository extends JpaRepository<ChatMember, Long> {

    List<ChatMember> findByChatroomId(Long chatRoomId);

    Boolean existsByUserIdAndChatroomId(Long userId, Long chatroomId);

    void deleteByUserIdAndChatroomId(Long userId, Long chatroomId);

    Slice<ChatMember> findAllByUserId(Long userId, Pageable pageable);

    Optional<ChatMember> findByUserIdAndChatroomId(Long userId, Long chatroomId);
    
}
