package com.stayswap.house.repository;

import com.stayswap.house.model.dto.request.HouseSearchRequest;
import com.stayswap.house.model.dto.response.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface HouseRepositoryCustom {
    
    Page<HouseListResponse> getHouseList(HouseSearchRequest request, Pageable pageable);
    
    HouseDetailResponse getHouseDetail(@Param("houseId") Long houseId);
    
    Long getHostIdByHouseId(Long houseId);
    
    HostDetailResponse getHostDetailById(Long hostId);
    
    List<HouseImageResponse> getHouseImages(Long houseId);
    
    Slice<MyHouseResponse> getMyHouses(Long userId, Pageable pageable);
} 