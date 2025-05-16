package com.stayswap.domains.house.repository;

import com.stayswap.domains.house.model.dto.request.HouseSearchRequest;
import com.stayswap.domains.house.model.dto.response.HouseDetailResponse;
import com.stayswap.domains.house.model.dto.response.HostDetailResponse;
import com.stayswap.domains.house.model.dto.response.HouseImageResponse;
import com.stayswap.domains.house.model.dto.response.HouseListResponse;
import com.stayswap.domains.house.model.dto.response.MyHouseResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface HouseRepositoryCustom {
    
    Page<HouseListResponse> getHouseList(HouseSearchRequest request, Pageable pageable);
    
    HouseDetailResponse getHouseDetail(Long houseId);
    
    Long getHostIdByHouseId(Long houseId);
    
    HostDetailResponse getHostDetailById(Long hostId);
    
    List<HouseImageResponse> getHouseImages(Long houseId);
    
    Page<MyHouseResponse> getMyHouses(Long userId, Pageable pageable);
} 