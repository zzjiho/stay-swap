package com.stayswap.domains.swap.controller;

import com.stayswap.domains.swap.model.dto.request.SwapRequest;
import com.stayswap.domains.swap.model.dto.request.StayRequest;
import com.stayswap.domains.swap.model.dto.response.SwapResponse;
import com.stayswap.domains.swap.model.dto.response.StayResponse;
import com.stayswap.domains.swap.service.SwapService;
import com.stayswap.global.model.RestApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/house")
@Tag(name = "swap", description = "숙소 교환 API")
public class SwapController {

    private final SwapService swapService;

    @Operation(
            summary = "숙소 교환 요청 API",
            description = "숙소 교환을 요청합니다. 요청자 숙소 ID, 대상 숙소 ID, 체크인/체크아웃 날짜, 메시지 등의 정보가 필요합니다."
    )
    @PostMapping("/swap")
    public RestApiResponse<SwapResponse> createSwapExchange(
            @RequestParam("requesterId") Long requesterId,
            @Valid @RequestBody SwapRequest request,
            BindingResult bindingResult) {
        
        return RestApiResponse.success(swapService.createSwapRequest(requesterId, request));
    }

    @Operation(
            summary = "숙소 숙박 요청 API",
            description = "숙소 숙박을 요청합니다. 대상 숙소 ID, 체크인/체크아웃 날짜, 메시지 등의 정보가 필요합니다."
    )
    @PostMapping("/stay")
    public RestApiResponse<StayResponse> createSwapStay(
            @RequestParam("userId") Long userId,
            @Valid @RequestBody StayRequest request,
            BindingResult bindingResult) {
        
        return RestApiResponse.success(swapService.createStayRequest(userId, request));
    }

    @Operation(
            summary = "숙박, 교환 수락 API",
            description = "다른 사용자들이 내 숙소에 숙박, 교환 요청한것을 수락합니다. " +
                    "PENDING 상태의 요청만 수락 가능합니다."
    )
    @PostMapping("/swap/{swapId}/accept")
    public RestApiResponse<SwapResponse> acceptSwapRequest(
            @RequestParam("userId") Long userId,
            @PathVariable("swapId") Long swapId) {
        
        return RestApiResponse.success(swapService.acceptSwapRequest(userId, swapId));
    }

    @Operation(
            summary = "숙박, 교환 거절 API",
            description = "다른 사용자들이 내 숙소에 숙박, 교환 요청한것을 거절합니다. " +
                    "상태여부 관계없이 거절 가능합니다."
    )
    @PostMapping("/swap/{swapId}/reject")
    public RestApiResponse<SwapResponse> rejectSwapRequest(
            @RequestParam("userId") Long userId,
            @PathVariable("swapId") Long swapId) {
        
        return RestApiResponse.success(swapService.rejectSwapRequest(userId, swapId));
    }

    @Operation(
            summary = "숙박, 교환 취소 API",
            description = "다른 사용자들의 숙소에 숙박, 교환 요청한것을 취소합니다."
    )
    @PostMapping("/swap/{swapId}/cancel")
    public RestApiResponse<SwapResponse> cancelSwapRequest(
            @RequestParam("userId") Long userId,
            @PathVariable("swapId") Long swapId) {
        
        return RestApiResponse.success(swapService.cancelSwapRequest(userId, swapId));
    }

} 