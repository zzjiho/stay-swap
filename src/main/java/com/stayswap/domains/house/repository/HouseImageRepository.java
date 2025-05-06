package com.stayswap.domains.house.repository;

import com.stayswap.domains.house.model.entity.House;
import com.stayswap.domains.house.model.entity.HouseImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HouseImageRepository extends JpaRepository<HouseImage, Long> {
    List<HouseImage> findByHouse(House house);
    
    List<HouseImage> findByHouseId(Long houseId);
}
