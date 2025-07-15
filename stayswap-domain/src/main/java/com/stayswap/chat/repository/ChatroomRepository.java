package com.stayswap.chat.repository;

import com.stayswap.chat.model.entity.Chatroom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ChatroomRepository extends JpaRepository<Chatroom, Long> {

    @Query("SELECT c FROM Chatroom c " +
           "JOIN ChatMember ucm1 ON c.id = ucm1.chatroom.id " +
           "JOIN ChatMember ucm2 ON c.id = ucm2.chatroom.id " +
           "WHERE ucm1.user.id = :userId AND ucm2.user.id = :partnerId " +
           "AND c.id IN (SELECT c2.id FROM Chatroom c2 JOIN ChatMember ucm3 ON c2.id = ucm3.chatroom.id GROUP BY c2.id HAVING COUNT(ucm3.id) = 2)")
    Optional<Chatroom> findDirectChatroomBetweenUsers(@Param("userId") Long userId, @Param("partnerId") Long partnerId);

}
