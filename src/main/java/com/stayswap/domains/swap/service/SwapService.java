package com.stayswap.domains.swap.service;

import com.stayswap.domains.swap.model.dto.request.SwapRequest;
import com.stayswap.domains.swap.model.dto.request.StayRequest;
import com.stayswap.domains.swap.model.dto.response.SwapResponse;
import com.stayswap.domains.swap.model.dto.response.StayResponse;

public interface SwapService {
    SwapResponse createSwapRequest(Long requesterId, SwapRequest request);
    StayResponse createStayRequest(Long requesterId, StayRequest request);
    SwapResponse acceptSwapRequest(Long userId, Long swapId);
    SwapResponse rejectSwapRequest(Long userId, Long swapId);
    SwapResponse cancelSwapRequest(Long userId, Long swapId);
} 