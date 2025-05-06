package com.stayswap.domains.house.repository;

import com.stayswap.domains.house.model.entity.House;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HouseRepository extends JpaRepository<House, Long>, HouseRepositoryCustom {
    
    List<House> findTop10ByIsActiveTrueOrderByRegTimeDesc();
}
