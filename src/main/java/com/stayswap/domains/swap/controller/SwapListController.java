package com.stayswap.domains.swap.controller;

import com.stayswap.domains.swap.constant.SwapStatus;
import com.stayswap.domains.swap.model.dto.response.SwapListResponse;
import com.stayswap.domains.swap.service.SwapListService;
import com.stayswap.global.model.RestApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/house")
@Tag(name = "swap", description = "숙소 관리 API")
public class SwapListController {

    private final SwapListService swapListService;

    @Operation(
            summary = "전체 교환/숙박 요청 목록 조회 API",
            description = "사용자와 관련된 모든 교환/숙박 요청 목록을 조회합니다. 게스트와 호스트 모두 포함됩니다. 무한 스크롤을 위한 커서 기반 페이징을 지원합니다."
    )
    @GetMapping("/swap/list")
    public RestApiResponse<List<SwapListResponse>> getAllSwapList(
            @RequestParam("userId") Long userId,
            @RequestParam(value = "lastSwapId", required = false) Long lastSwapId,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        
        return RestApiResponse.success(swapListService.getAllSwapListByUser(userId, lastSwapId, size));
    }

    @Operation(
            summary = "내가 요청한 교환/숙박 목록 조회 API",
            description = "사용자가 게스트로서 요청한 교환/숙박 목록을 조회합니다. 무한 스크롤을 위한 커서 기반 페이징을 지원합니다."
    )
    @GetMapping("/swap/list/requester")
    public RestApiResponse<List<SwapListResponse>> getSwapListByRequester(
            @RequestParam("userId") Long userId,
            @RequestParam(value = "lastSwapId", required = false) Long lastSwapId,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        
        return RestApiResponse.success(swapListService.getSwapListByRequester(userId, lastSwapId, size));
    }

    @Operation(
            summary = "내 숙소에 대한 교환/숙박 요청 목록 조회 API",
            description = "사용자가 호스트로서 받은 교환/숙박 요청 목록을 조회합니다. 무한 스크롤을 위한 커서 기반 페이징을 지원합니다."
    )
    @GetMapping("/swap/list/host")
    public RestApiResponse<List<SwapListResponse>> getSwapListByHost(
            @RequestParam("userId") Long userId,
            @RequestParam(value = "lastSwapId", required = false) Long lastSwapId,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        
        return RestApiResponse.success(swapListService.getSwapListByHost(userId, lastSwapId, size));
    }

    @Operation(
            summary = "상태별 교환/숙박 요청 목록 조회 API",
            description = "특정 상태(대기, 확정, 거절, 취소, 완료)에 해당하는 교환/숙박 요청 목록을 조회합니다. 무한 스크롤을 위한 커서 기반 페이징을 지원합니다."
    )
    @GetMapping("/swap/list/status/{status}")
    public RestApiResponse<List<SwapListResponse>> getSwapListByStatus(
            @RequestParam("userId") Long userId,
            @PathVariable("status") String status,
            @RequestParam(value = "lastSwapId", required = false) Long lastSwapId,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        
        SwapStatus swapStatus;
        try {
            swapStatus = SwapStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 상태값입니다: " + status);
        }
        
        return RestApiResponse.success(swapListService.getSwapListByStatus(userId, swapStatus, lastSwapId, size));
    }

    @Operation(
            summary = "타입별 교환/숙박 요청 목록 조회 API",
            description = "특정 타입(교환 또는 숙박)에 해당하는 요청 목록을 조회합니다. 무한 스크롤을 위한 커서 기반 페이징을 지원합니다."
    )
    @GetMapping("/swap/list/type/{type}")
    public RestApiResponse<List<SwapListResponse>> getSwapListByType(
            @RequestParam("userId") Long userId,
            @PathVariable("type") String type,
            @RequestParam(value = "lastSwapId", required = false) Long lastSwapId,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        
        return RestApiResponse.success(swapListService.getSwapListByType(userId, type, lastSwapId, size));
    }
}