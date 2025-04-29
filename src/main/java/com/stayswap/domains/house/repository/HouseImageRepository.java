package com.stayswap.domains.house.repository;

import com.stayswap.domains.house.model.entity.HouseImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HouseImageRepository extends JpaRepository<HouseImage, Long> {
}
