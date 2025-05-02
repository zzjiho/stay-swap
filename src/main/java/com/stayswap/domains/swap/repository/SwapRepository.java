package com.stayswap.domains.swap.repository;

import com.stayswap.domains.swap.constant.SwapStatus;
import com.stayswap.domains.swap.constant.SwapType;
import com.stayswap.domains.swap.model.entity.Swap;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SwapRepository extends JpaRepository<Swap, Long> {
    // 사용자가 요청자인 모든 교환/숙박 요청 목록 (게스트)
    @Query("SELECT s FROM Swap s WHERE s.requester.id = :requesterId AND (:lastSwapId IS NULL OR s.id < :lastSwapId) ORDER BY s.id DESC")
    List<Swap> findByRequesterIdWithCursor(@Param("requesterId") Long requesterId, @Param("lastSwapId") Long lastSwapId, Pageable pageable);
    
    // 사용자가 호스트인 모든 교환/숙박 요청 목록 (호스트)
    @Query("SELECT s FROM Swap s JOIN s.house h WHERE h.user.id = :userId AND (:lastSwapId IS NULL OR s.id < :lastSwapId) ORDER BY s.id DESC")
    List<Swap> findByHouseUserIdWithCursor(@Param("userId") Long userId, @Param("lastSwapId") Long lastSwapId, Pageable pageable);
    
    // 사용자와 관련된 모든 교환/숙박 요청 목록 (게스트 + 호스트)
    @Query("SELECT s FROM Swap s LEFT JOIN s.house h WHERE (s.requester.id = :userId OR h.user.id = :userId) AND (:lastSwapId IS NULL OR s.id < :lastSwapId) ORDER BY s.id DESC")
    List<Swap> findAllByUserWithCursor(@Param("userId") Long userId, @Param("lastSwapId") Long lastSwapId, Pageable pageable);
    
    // 상태별 교환/숙박 요청 목록
    @Query("SELECT s FROM Swap s LEFT JOIN s.house h WHERE (s.requester.id = :userId OR h.user.id = :userId) AND s.swapStatus = :status AND (:lastSwapId IS NULL OR s.id < :lastSwapId) ORDER BY s.id DESC")
    List<Swap> findByStatusAndUserWithCursor(@Param("userId") Long userId, @Param("status") SwapStatus status, @Param("lastSwapId") Long lastSwapId, Pageable pageable);
    
    // 타입별 교환/숙박 요청 목록
    @Query("SELECT s FROM Swap s LEFT JOIN s.house h WHERE (s.requester.id = :userId OR h.user.id = :userId) AND s.swapType = :type AND (:lastSwapId IS NULL OR s.id < :lastSwapId) ORDER BY s.id DESC")
    List<Swap> findByTypeAndUserWithCursor(@Param("userId") Long userId, @Param("type") SwapType type, @Param("lastSwapId") Long lastSwapId, Pageable pageable);
} 