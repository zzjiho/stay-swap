package com.stayswap.domains.swap.repository.custom;

import com.stayswap.domains.swap.model.dto.request.SwapSearchRequest;
import com.stayswap.domains.swap.model.dto.response.SwapListResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface SwapRepositoryCustom {
    
    // 사용자가 요청자인 교환/숙박 요청 목록 조회 (게스트) - 상태 및 타입으로 필터링 가능
    Page<SwapListResponse> getSwapListByRequester(SwapSearchRequest request, Pageable pageable);
    
    // 사용자가 호스트인 교환/숙박 요청 목록 조회 (호스트) - 상태 및 타입으로 필터링 가능
    Page<SwapListResponse> getSwapListByHost(SwapSearchRequest request, Pageable pageable);
} 