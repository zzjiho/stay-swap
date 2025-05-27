package com.stayswap.house.repository;

import com.stayswap.house.model.entity.House;
import com.stayswap.house.model.entity.HouseImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HouseImageRepository extends JpaRepository<HouseImage, Long> {
    List<HouseImage> findByHouse(House house);
    
    List<HouseImage> findByHouseId(Long houseId);
}
