package com.stayswap.domains.swap.repository;

import com.stayswap.domains.swap.model.entity.Swap;
import com.stayswap.domains.swap.repository.custom.SwapRepositoryCustom;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SwapRepository extends JpaRepository<Swap, Long>, SwapRepositoryCustom {
    // 사용자와 관련된 모든 교환/숙박 요청 목록 (게스트 + 호스트)
    @Query("SELECT s FROM Swap s LEFT JOIN s.house h WHERE (s.requester.id = :userId OR h.user.id = :userId)")
    Page<Swap> findAllByUser(@Param("userId") Long userId, Pageable pageable);
} 