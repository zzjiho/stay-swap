package com.stayswap.domains.swap.service;

import com.stayswap.domains.swap.constant.SwapStatus;
import com.stayswap.domains.swap.constant.SwapType;
import com.stayswap.domains.swap.model.dto.response.SwapListResponse;
import com.stayswap.domains.swap.model.entity.Swap;
import com.stayswap.domains.swap.repository.SwapRepository;
import com.stayswap.domains.user.repository.UserRepository;
import com.stayswap.global.code.ErrorCode;
import com.stayswap.global.error.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class SwapListServiceImpl implements SwapListService {

    private final SwapRepository swapRepository;
    private final UserRepository userRepository;

    @Override
    public List<SwapListResponse> getAllSwapListByUser(Long userId, Long lastSwapId, int size) {
        validateUser(userId);
        
        Pageable pageable = PageRequest.of(0, size);
        List<Swap> swaps = swapRepository.findAllByUserWithCursor(userId, lastSwapId, pageable);
        return swaps.stream()
                .map(SwapListResponse::of)
                .collect(Collectors.toList());
    }

    @Override
    public List<SwapListResponse> getSwapListByRequester(Long userId, Long lastSwapId, int size) {
        validateUser(userId);
        
        Pageable pageable = PageRequest.of(0, size);
        List<Swap> swaps = swapRepository.findByRequesterIdWithCursor(userId, lastSwapId, pageable);
        return swaps.stream()
                .map(SwapListResponse::of)
                .collect(Collectors.toList());
    }

    @Override
    public List<SwapListResponse> getSwapListByHost(Long userId, Long lastSwapId, int size) {
        validateUser(userId);
        
        Pageable pageable = PageRequest.of(0, size);
        List<Swap> swaps = swapRepository.findByHouseUserIdWithCursor(userId, lastSwapId, pageable);
        return swaps.stream()
                .map(SwapListResponse::of)
                .collect(Collectors.toList());
    }

    @Override
    public List<SwapListResponse> getSwapListByStatus(Long userId, SwapStatus status, Long lastSwapId, int size) {
        validateUser(userId);
        
        Pageable pageable = PageRequest.of(0, size);
        List<Swap> swaps = swapRepository.findByStatusAndUserWithCursor(userId, status, lastSwapId, pageable);
        return swaps.stream()
                .map(SwapListResponse::of)
                .collect(Collectors.toList());
    }

    @Override
    public List<SwapListResponse> getSwapListByType(Long userId, String type, Long lastSwapId, int size) {
        validateUser(userId);
        
        SwapType swapType;
        try {
            swapType = SwapType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 교환/숙박 타입입니다: " + type);
        }
        
        Pageable pageable = PageRequest.of(0, size);
        List<Swap> swaps = swapRepository.findByTypeAndUserWithCursor(userId, swapType, lastSwapId, pageable);
        return swaps.stream()
                .map(SwapListResponse::of)
                .collect(Collectors.toList());
    }
    
    // 사용자 존재 여부 확인 메서드
    private void validateUser(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.NOT_EXISTS_USER));
    }
} 