package com.stayswap.swap.controller;

import com.stayswap.common.resolver.userinfo.UserInfo;
import com.stayswap.common.resolver.userinfo.UserInfoDto;
import com.stayswap.model.RestApiResponse;
import com.stayswap.swap.constant.SwapStatus;
import com.stayswap.swap.constant.SwapType;
import com.stayswap.swap.model.dto.response.SwapListForGuestResponse;
import com.stayswap.swap.model.dto.response.SwapListForHostResponse;
import com.stayswap.swap.service.SwapListService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequiredArgsConstructor
@RequestMapping("api/house")
@Tag(name = "swap", description = "숙소 관리 API")
public class SwapListController {


    private final SwapListService swapListService;

//    @Operation(
//            summary = "전체 교환/숙박 요청 목록 조회 API",
//            description = "사용자와 관련된 모든 교환/숙박 요청 목록을 조회합니다. 게스트와 호스트 모두 포함됩니다. 무한 스크롤을 위한 페이징을 지원합니다."
//    )
//    @GetMapping("/swap/list")
//    public RestApiResponse<Page<SwapListForGuestResponse>> getAllSwapList(
//            @RequestParam("userId") Long userId,
//            @PageableDefault(size = 10) Pageable pageable) {
//
//        return RestApiResponse.success(swapListService.getAllSwapListByUser(userId, pageable));
//    }

    @Operation(
            summary = "내가 요청한 교환/숙박 목록 조회 API",
            description = "사용자가 게스트로서 요청한 교환/숙박 목록을 조회합니다. 상태 또는 타입으로 필터링 가능합니다."
    )
    @GetMapping("/swap/list/requester")
    public RestApiResponse<Slice<SwapListForGuestResponse>> getSwapListByRequester(
            @UserInfo UserInfoDto userInfo,
            @RequestParam(value = "swapType", required = false) SwapType swapType,
            @RequestParam(value = "swapStatus", required = false) SwapStatus swapStatus,
            @PageableDefault(size = 10) Pageable pageable) {

        return RestApiResponse.success(
                swapListService.getSwapListByRequester(userInfo.getUserId(), swapStatus, swapType, pageable));
    }

    @Operation(
            summary = "내 숙소에 대한 교환/숙박 요청 목록 조회 API",
            description = "사용자가 호스트로서 받은 교환/숙박 요청 목록을 조회합니다. 상태 또는 타입으로 필터링 가능합니다."
    )
    @GetMapping("/swap/list/host")
    public RestApiResponse<Slice<SwapListForHostResponse>> getSwapListByHost(
            @UserInfo UserInfoDto userInfo,
            @RequestParam(value = "swapType", required = false) SwapType swapType,
            @RequestParam(value = "swapStatus", required = false) SwapStatus swapStatus,
            @PageableDefault(size = 10) Pageable pageable) {

        return RestApiResponse.success(
                swapListService.getSwapListByHost(userInfo.getUserId(), swapStatus, swapType, pageable));
    }
}