package com.stayswap.domains.swap.service;

import com.stayswap.domains.swap.constant.SwapStatus;
import com.stayswap.domains.swap.model.dto.response.SwapListResponse;

import java.util.List;

public interface SwapListService {

    // 사용자의 모든 교환/숙박 요청 목록 조회
    List<SwapListResponse> getAllSwapListByUser(Long userId, Long lastSwapId, int size);

    // 사용자가 보낸 교환/숙박 요청 목록 조회 (게스트)
    List<SwapListResponse> getSwapListByRequester(Long userId, Long lastSwapId, int size);

    // 사용자의 숙소에 대한 교환/숙박 요청 목록 조회 (호스트)
    List<SwapListResponse> getSwapListByHost(Long userId, Long lastSwapId, int size);

    // 상태별 교환/숙박 요청 목록 조회
    List<SwapListResponse> getSwapListByStatus(Long userId, SwapStatus status, Long lastSwapId, int size);

    // 타입별 (교환/숙박) 요청 목록 조회
    List<SwapListResponse> getSwapListByType(Long userId, String type, Long lastSwapId, int size);
}
