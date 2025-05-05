package com.stayswap.domains.review.repository;

import com.stayswap.domains.house.model.entity.House;
import com.stayswap.domains.review.model.entity.Review;
import com.stayswap.domains.swap.model.entity.Swap;
import com.stayswap.domains.user.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    boolean existsBySwapAndUserAndTargetHouse(Swap swap, User user, House targetHouse);
}