package com.stayswap.swap.service;

import com.stayswap.error.exception.BusinessException;
import com.stayswap.error.exception.ForbiddenException;
import com.stayswap.error.exception.NotFoundException;
import com.stayswap.house.model.entity.House;
import com.stayswap.house.repository.HouseRepository;
import com.stayswap.notification.service.facade.SwapRequestNotificationService;
import com.stayswap.swap.constant.SwapStatus;
import com.stayswap.swap.constant.SwapType;
import com.stayswap.swap.model.dto.request.StayRequest;
import com.stayswap.swap.model.dto.request.SwapRequest;
import com.stayswap.swap.model.dto.response.StayResponse;
import com.stayswap.swap.model.dto.response.SwapResponse;
import com.stayswap.swap.model.entity.Swap;
import com.stayswap.swap.repository.SwapRepository;
import com.stayswap.user.model.entity.User;
import com.stayswap.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.stayswap.code.ErrorCode.*;


@Service
@Transactional
@RequiredArgsConstructor
public class SwapServiceImpl implements SwapService {

    private final SwapRepository swapRepository;
    private final UserRepository userRepository;
    private final HouseRepository houseRepository;
    private final SwapRequestNotificationService swapRequestNotificationService;

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
        
        // 알림 전송
        Long recipientId = targetHouse.getUser().getId();
        swapRequestNotificationService.createSwapRequestNotification(recipientId, requesterId, savedSwap.getId());

        return SwapResponse.of(savedSwap);
    }

    @Override
    public StayResponse createStayRequest(Long requesterId, StayRequest request) {
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));

        House targetHouse = validateTargetHouse(requesterId, request.getTargetHouseId());

        Swap swap = request.toEntity(requester, targetHouse);
        Swap savedSwap = swapRepository.save(swap);
        
        // 알림 전송
        Long recipientId = targetHouse.getUser().getId();
        swapRequestNotificationService.createBookingRequestNotification(recipientId, requesterId, savedSwap.getId());

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
        
        // 알림 전송 - 교환 요청인 경우와 숙박 요청인 경우 구분
        Long requesterId = swap.getRequester().getId();
        if (swap.getSwapType() == SwapType.SWAP) {
            // 교환 요청인 경우
            swapRequestNotificationService.createSwapAcceptedNotification(requesterId, userId, swapId);
        } else {
            // 숙박 요청인 경우
            swapRequestNotificationService.createBookingAcceptedNotification(requesterId, userId, swapId);
        }
        
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
        
        // 알림 전송 - 교환 요청인 경우와 숙박 요청인 경우 구분
        Long requesterId = swap.getRequester().getId();
        if (swap.getSwapType() == SwapType.SWAP) {
            // 교환 요청인 경우
            swapRequestNotificationService.createSwapRejectedNotification(requesterId, userId, swapId);
        } else {
            // 숙박 요청인 경우
            swapRequestNotificationService.createBookingRejectedNotification(requesterId, userId, swapId);
        }
        
        return SwapResponse.of(swap);
    }

    @Override
    public SwapResponse cancelSwapRequest(Long userId, Long swapId) {

        Swap swap = swapRepository.findById(swapId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_SWAP_REQUEST));
        
        if (!swap.getRequester().getId().equals(userId)) {
            throw new BusinessException(CANNOT_CANCEL_OTHERS_REQUEST);
        }
        
        // 완료된 요청 취소 불가
        if (swap.getSwapStatus() == SwapStatus.COMPLETED) {
            throw new BusinessException(CANNOT_CANCEL_COMPLETED_REQUEST);
        }
        
        swap.cancel();
        
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