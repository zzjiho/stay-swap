package com.stayswap.domains.swap.service;

import com.stayswap.domains.swap.model.dto.request.SwapSearchRequest;
import com.stayswap.domains.swap.model.dto.response.SwapListResponse;
import com.stayswap.domains.swap.model.entity.Swap;
import com.stayswap.domains.swap.repository.SwapRepository;
import com.stayswap.domains.user.repository.UserRepository;
import com.stayswap.global.code.ErrorCode;
import com.stayswap.global.error.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SwapListServiceImpl implements SwapListService {

    private final SwapRepository swapRepository;
    private final UserRepository userRepository;

    @Override
    public Page<SwapListResponse> getAllSwapListByUser(Long userId, Pageable pageable) {
        validateUser(userId);
        
        Page<Swap> swaps = swapRepository.findAllByUser(userId, pageable);
        return swaps.map(SwapListResponse::of);
    }

    @Override
    public Page<SwapListResponse> getSwapListByRequester(SwapSearchRequest request, Pageable pageable) {
        validateUser(request.getUserId());
        return swapRepository.getSwapListByRequester(request, pageable);
    }

    @Override
    public Page<SwapListResponse> getSwapListByHost(SwapSearchRequest request, Pageable pageable) {
        validateUser(request.getUserId());
        return swapRepository.getSwapListByHost(request, pageable);
    }
    
    // 사용자 존재 여부 확인 메서드
    private void validateUser(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.NOT_EXISTS_USER));
    }
} 