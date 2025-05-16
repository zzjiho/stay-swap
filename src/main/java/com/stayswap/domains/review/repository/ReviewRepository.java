package com.stayswap.domains.review.repository;

import com.stayswap.domains.house.model.entity.House;
import com.stayswap.domains.review.model.dto.response.ReceivedReviewResponse;
import com.stayswap.domains.review.model.entity.Review;
import com.stayswap.domains.swap.model.entity.Swap;
import com.stayswap.domains.user.model.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long>, ReviewRepositoryCustom {
    boolean existsBySwapAndUserAndTargetHouse(Swap swap, User user, House targetHouse);
    
     // 내 숙소 리뷰 개수 조회
    @Query("SELECT COUNT(r) FROM Review r JOIN r.targetHouse h WHERE h.user.id = :userId")
    Long countByTargetHouseUserId(@Param("userId") Long userId);
    
    // 내가 받은 리뷰 조회
    @Query("SELECT r FROM Review r JOIN r.targetHouse h WHERE h.user.id = :userId ORDER BY r.regTime DESC")
    Page<ReceivedReviewResponse> findReceivedReviews(@Param("userId") Long userId, Pageable pageable);
}