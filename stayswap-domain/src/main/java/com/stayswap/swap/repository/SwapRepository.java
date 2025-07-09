package com.stayswap.swap.repository;

import com.stayswap.swap.constant.SwapStatus;
import com.stayswap.swap.model.entity.Swap;
import com.stayswap.swap.repository.custom.SwapRepositoryCustom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SwapRepository extends JpaRepository<Swap, Long>, SwapRepositoryCustom {

    /**
     * 36시간 이상 지난 PENDING 상태의 Swap 조회
     */
    @Query("SELECT s FROM Swap s WHERE s.swapStatus = :status AND s.regTime <= :cutoffTime")
    List<Swap> findPendingSwapsOlderThan(@Param("status") SwapStatus status, @Param("cutoffTime") LocalDateTime cutoffTime);

    /**
     * 특정 숙소에 대해 PENDING 상태인 Swap 요청이 있는지 확인
     */
    @Query("SELECT COUNT(s) > 0 FROM Swap s WHERE s.house.id = :houseId AND s.swapStatus = :status")
    boolean existsByHouseIdAndSwapStatus(@Param("houseId") Long houseId, @Param("status") SwapStatus status);
}