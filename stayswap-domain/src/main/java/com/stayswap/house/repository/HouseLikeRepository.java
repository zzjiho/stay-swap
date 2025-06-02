package com.stayswap.house.repository;

import com.stayswap.house.model.entity.House;
import com.stayswap.house.model.entity.HouseLike;
import com.stayswap.user.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HouseLikeRepository extends JpaRepository<HouseLike, Long> {
    
    Optional<HouseLike> findByUserAndHouse(User user, House house);
    
    boolean existsByUserAndHouse(User user, House house);
    
    void deleteByUserAndHouse(User user, House house);
} 