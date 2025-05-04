package com.stayswap.domains.swap.repository.custom;

import com.stayswap.domains.swap.constant.SwapStatus;
import com.stayswap.domains.swap.constant.SwapType;
import com.stayswap.domains.swap.model.dto.response.SwapListResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

public interface SwapRepositoryCustom {
    
    // 사용자가 요청자인 교환/숙박 요청 목록 조회 (게스트) - 상태 및 타입으로 필터링 가능
    Slice<SwapListResponse> getSwapListByRequester(Long userId, SwapStatus swapStatus, SwapType swapType, Pageable pageable);
    
    // 사용자가 호스트인 교환/숙박 요청 목록 조회 (호스트) - 상태 및 타입으로 필터링 가능
    Slice<SwapListResponse> getSwapListByHost(Long userId, SwapStatus swapStatus, SwapType swapType, Pageable pageable);

    // 사용자와 관련된 모든 교환/숙박 요청 목록 조회 (게스트 + 호스트)
//    Page<SwapListResponse> getAllSwapListByUser(Long userId, Pageable pageable);
}