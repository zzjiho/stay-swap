package com.stayswap.house.controller;

import com.stayswap.common.resolver.userinfo.UserInfo;
import com.stayswap.common.resolver.userinfo.UserInfoDto;
import com.stayswap.house.model.dto.response.HouseLikeResponse;
import com.stayswap.house.service.HouseLikeService;
import com.stayswap.model.RestApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/house")
@Tag(name = "house-like", description = "숙소 좋아요 API")
public class HouseLikeController {

    private final HouseLikeService houseLikeService;

    @Operation(
            summary = "숙소 좋아요 등록 API",
            description = "숙소에 좋아요를 등록합니다. 이미 좋아요가 등록되어 있으면 아무 작업도 수행하지 않습니다."
    )
    @PostMapping("/{houseId}/like")
    public RestApiResponse<HouseLikeResponse> addLike(
            @PathVariable("houseId") Long houseId,
            @UserInfo UserInfoDto userInfo) {
        
        boolean isAdded = houseLikeService.addLike(houseId, userInfo.getUserId());
        return RestApiResponse.success(HouseLikeResponse.of(true));
    }

    @Operation(
            summary = "숙소 좋아요 취소 API",
            description = "숙소에 등록된 좋아요를 취소합니다. 좋아요가 등록되어 있지 않으면 아무 작업도 수행하지 않습니다."
    )
    @DeleteMapping("/{houseId}/like")
    public RestApiResponse<HouseLikeResponse> cancelLike(
            @PathVariable("houseId") Long houseId,
            @UserInfo UserInfoDto userInfo) {
        
        boolean isCanceled = houseLikeService.cancelLike(houseId, userInfo.getUserId());
        return RestApiResponse.success(HouseLikeResponse.of(false));
    }

    @Operation(
            summary = "숙소 좋아요 상태 조회 API",
            description = "사용자가 특정 숙소에 좋아요를 등록했는지 여부를 조회합니다."
    )
    @GetMapping("/{houseId}/like")
    public RestApiResponse<HouseLikeResponse> getLikeStatus(
            @PathVariable("houseId") Long houseId,
            @UserInfo UserInfoDto userInfo) {
        
        boolean isLiked = houseLikeService.isLiked(houseId, userInfo.getUserId());
        return RestApiResponse.success(HouseLikeResponse.of(isLiked));
    }
} 