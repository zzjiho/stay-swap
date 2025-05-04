package com.stayswap.domains.swap.service;

import com.stayswap.domains.house.model.entity.House;
import com.stayswap.domains.house.repository.HouseRepository;
import com.stayswap.domains.swap.constant.SwapStatus;
import com.stayswap.domains.swap.constant.SwapType;
import com.stayswap.domains.swap.model.dto.request.SwapRequest;
import com.stayswap.domains.swap.model.dto.request.StayRequest;
import com.stayswap.domains.swap.model.dto.response.SwapResponse;
import com.stayswap.domains.swap.model.dto.response.StayResponse;
import com.stayswap.domains.swap.model.entity.Swap;
import com.stayswap.domains.swap.repository.SwapRepository;
import com.stayswap.domains.user.model.entity.User;
import com.stayswap.domains.user.repository.UserRepository;
import com.stayswap.global.code.ErrorCode;
import com.stayswap.global.error.exception.BusinessException;
import com.stayswap.global.error.exception.ForbiddenException;
import com.stayswap.global.error.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.naming.AuthenticationException;

import static com.stayswap.global.code.ErrorCode.*;
import static com.stayswap.global.code.ErrorCode.NOT_MY_HOUSE;

@Service
@Transactional
@RequiredArgsConstructor
public class SwapServiceImpl implements SwapService {

    private final SwapRepository swapRepository;
    private final UserRepository userRepository;
    private final HouseRepository houseRepository;

    @Override
    public SwapResponse createSwapRequest(Long requesterId, SwapRequest request) {
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));

        House requesterHouse = houseRepository.findById(request.getRequesterHouseId())
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_HOUSE));
        
        if (!requesterHouse.getUser().getId().equals(requesterId)) {
            throw new ForbiddenException(NOT_MY_HOUSE);
        }

        House targetHouse = validateTargetHouse(requesterId, request.getTargetHouseId());

        Swap swap = request.toEntity(requester, requesterHouse, targetHouse);
        Swap savedSwap = swapRepository.save(swap);

        return SwapResponse.of(savedSwap);
    }

    @Override
    public StayResponse createStayRequest(Long requesterId, StayRequest request) {
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));

        House targetHouse = validateTargetHouse(requesterId, request.getTargetHouseId());

        Swap swap = request.toEntity(requester, targetHouse);
        Swap savedSwap = swapRepository.save(swap);

        return StayResponse.of(savedSwap);
    }

    @Override
    public SwapResponse acceptSwapRequest(Long userId, Long swapId) {
        Swap swap = swapRepository.findById(swapId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_SWAP_REQUEST));
        
        // 자신의 숙소만 처리 가능
        if (!swap.getHouse().getUser().getId().equals(userId)) {
            throw new ForbiddenException(NOT_MY_HOUSE);
        }
        
        if (swap.getSwapStatus() != SwapStatus.PENDING) {
            throw new BusinessException(ALREADY_PROCESSED_REQUEST);
        }
        
        swap.accept();
        
        return SwapResponse.of(swap);
    }

    @Override
    public SwapResponse rejectSwapRequest(Long userId, Long swapId) {

        Swap swap = swapRepository.findById(swapId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_SWAP_REQUEST));
        
        if (!swap.getHouse().getUser().getId().equals(userId)) {
            throw new ForbiddenException(NOT_MY_HOUSE);
        }

        swap.reject();
        
        return SwapResponse.of(swap);
    }

    // 자신의 숙소에는 교환, 숙박 요청 불가
    private House validateTargetHouse(Long requesterId, Long targetHouseId) {
        House targetHouse = houseRepository.findById(targetHouseId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_HOUSE));

        if (targetHouse.getUser().getId().equals(requesterId)) {
            throw new ForbiddenException(CANNOT_SWAP_WITH_OWN_HOUSE);
        }
        
        return targetHouse;
    }
}