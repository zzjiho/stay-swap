package com.stayswap.domains.house.repository;

import com.stayswap.domains.house.model.dto.request.HouseSearchRequest;
import com.stayswap.domains.house.model.dto.response.HouseListResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface HouseRepositoryCustom {
    
    Page<HouseListResponse> getHouseList(HouseSearchRequest request, Pageable pageable);
} 