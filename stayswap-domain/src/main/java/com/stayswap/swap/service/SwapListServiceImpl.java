package com.stayswap.swap.service;

import com.stayswap.swap.constant.SwapStatus;
import com.stayswap.swap.constant.SwapType;
import com.stayswap.swap.model.dto.response.SwapListForGuestResponse;
import com.stayswap.swap.model.dto.response.SwapListForHostResponse;
import com.stayswap.swap.repository.SwapRepository;
import com.stayswap.user.repository.UserRepository;
import com.stayswap.code.ErrorCode;
import com.stayswap.error.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SwapListServiceImpl implements SwapListService {

    private final SwapRepository swapRepository;
    private final UserRepository userRepository;

//    @Override
//    public Page<SwapListForGuestResponse> getAllSwapListByUser(Long userId, Pageable pageable) {
//        validateUser(userId);
//        return swapRepository.getAllSwapListByUser(userId, pageable);
//    }

    @Override
    public Slice<SwapListForGuestResponse> getSwapListByRequester(Long userId, SwapStatus swapStatus, SwapType swapType, Pageable pageable) {
        validateUser(userId);
        return swapRepository.getSwapListByRequester(userId, swapStatus, swapType, pageable);
    }

    @Override
    public Slice<SwapListForHostResponse> getSwapListByHost(Long userId, SwapStatus swapStatus, SwapType swapType, Pageable pageable) {
        validateUser(userId);
        return swapRepository.getSwapListByHost(userId, swapStatus, swapType, pageable);
    }

    // 사용자 존재 여부 확인 메서드
    private void validateUser(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.NOT_EXISTS_USER));
    }
} 