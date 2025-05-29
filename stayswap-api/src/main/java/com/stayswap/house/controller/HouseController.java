package com.stayswap.house.controller;

import com.stayswap.house.model.dto.request.CreateHouseRequest;
import com.stayswap.house.model.dto.request.HouseSearchRequest;
import com.stayswap.house.model.dto.request.UpdateHouseRequest;
import com.stayswap.house.model.dto.response.*;
import com.stayswap.house.service.HouseRedisService;
import com.stayswap.house.service.HouseService;
import com.stayswap.model.RestApiResponse;
import com.stayswap.common.resolver.userinfo.UserInfo;
import com.stayswap.common.resolver.userinfo.UserInfoDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/house")
@Tag(name = "house", description = "숙소(집) API")
public class HouseController {

    private final HouseService houseService;
    private final HouseRedisService houseRedisService;

    @Operation(
            summary = "숙소 등록 API",
            description = "숙소를 등록합니다." +
                    " 숙소 등록 시, 이미지 파일을 함께 최대 10장 업로드할 수 있습니다."
    )
    @PostMapping("")
    public RestApiResponse<CreateHouseResponse> createHouse(
            @UserInfo UserInfoDto userInfo,
            @Valid @RequestPart(value = "request") CreateHouseRequest request,
            @RequestPart(required = false, value = "images") List<MultipartFile> images,
            BindingResult bindingResult) throws IOException {

        return RestApiResponse.success(
                houseService.createHouse(userInfo.getUserId(), request, images));
    }
    
    @Operation(
            summary = "숙소 수정 API",
            description = "숙소 정보를 수정합니다." +
                    " 숙소 수정 시, 이미지 파일을 함께 최대 10장 업로드할 수 있습니다."
    )
    @PostMapping("/{houseId}")
    public RestApiResponse<UpdateHouseResponse> updateHouse(
            @PathVariable("houseId") Long houseId,
            @RequestParam("userId") Long userId,
            @Valid @RequestPart(value = "request") UpdateHouseRequest request,
            @RequestPart(required = false, value = "images") List<MultipartFile> images,
            BindingResult bindingResult) throws IOException {

        return RestApiResponse.success(
                houseService.updateHouse(houseId, userId, request, images));
    }

    @Operation(
            summary = "숙소 목록 조회 및 검색 API",
            description = "다양한 조건으로 숙소 목록을 조회하고 검색합니다. 무한 스크롤 구현을 위한 API입니다." +
                    " 모든 파라미터는 선택사항이며, 조건을 추가할수록 결과가 좁혀집니다." +
                    " 평점, 리뷰 수를 포함합니다."
    )
    @GetMapping("")
    public RestApiResponse<Page<HouseListResponse>> getHouseList(
            @ModelAttribute @Valid HouseSearchRequest request,
            @PageableDefault(size = 10) Pageable pageable) {
        
        return RestApiResponse.success(
                houseService.getHouseList(request, pageable));
    }

    @Operation(
            summary = "숙소 상세 조회 API",
            description = "숙소 상세 정보를 조회합니다. " +
                    "숙소의 기본 정보, 이미지, 편의시설 정보, 호스트 ID 등을 포함합니다."
    )
    @GetMapping("/{houseId}")
    public RestApiResponse<HouseDetailResponse> getHouseDetail(
            @PathVariable("houseId") Long houseId) {
        
        return RestApiResponse.success(houseService.getHouseDetail(houseId));
    }
    
    @Operation(
            summary = "숙소 호스트 상세 조회 API",
            description = "숙소의 호스트 상세 정보를 조회합니다."
    )
    @GetMapping("/{houseId}/host")
    public RestApiResponse<HostDetailResponse> getHostDetail(
            @PathVariable("houseId") Long houseId) {
        
        return RestApiResponse.success(houseService.getHostDetailByHouseId(houseId));
    }

    @Operation(
            summary = "최근 등록된 숙소 조회 API",
            description = "최근에 등록된 숙소를 조회합니다. Redis 캐시를 활용하여 빠른 응답을 제공합니다. " +
                    "기본적으로 3개의 최근 숙소를 반환하며, limit 파라미터로 개수를 조정할 수 있습니다(최대 10개)."
    )
    @GetMapping("/recent")
    public RestApiResponse<List<RecentHouseResponse>> getRecentHouses(
            @RequestParam(value = "limit", defaultValue = "3") int limit) {
        
        int validLimit = Math.min(Math.max(limit, 1), 10);
        
        return RestApiResponse.success(houseRedisService.getRecentHouses(validLimit));
    }
    
    @Operation(
            summary = "인기 숙소 조회 API",
            description = "평점 4점 이상, 리뷰 수가 많은 순서로 인기 숙소를 조회합니다. Redis 캐시를 활용하여 빠른 응답을 제공합니다. " +
                    "기본적으로 3개의 인기 숙소를 반환하며, limit 파라미터로 개수를 조정할 수 있습니다(최대 10개)."
    )
    @GetMapping("/popular")
    public RestApiResponse<List<PopularHouseResponse>> getPopularHouses(
            @RequestParam(value = "limit", defaultValue = "3") int limit) {
        
        int validLimit = Math.min(Math.max(limit, 1), 10);
        
        return RestApiResponse.success(houseRedisService.getPopularHouses(validLimit));
    }

    @Operation(
            summary = "숙소 이미지 조회 API",
            description = "숙소의 모든 이미지를 조회합니다."
    )
    @GetMapping("/{houseId}/images")
    public RestApiResponse<List<HouseImageResponse>> getHouseImages(
            @PathVariable("houseId") Long houseId) {
        
        return RestApiResponse.success(houseService.getHouseImages(houseId));
    }

    @Operation(
            summary = "내 숙소 목록 조회 API",
            description = "사용자가 등록한 숙소 목록을 조회합니다. 무한 스크롤 구현을 위한 API입니다." +
                    " 숙소의 기본 정보, 평점, 리뷰 수를 포함합니다."
    )
    @GetMapping("/my")
    public RestApiResponse<Page<MyHouseResponse>> getMyHouses(
            @UserInfo UserInfoDto userInfo,
            @PageableDefault(size = 10) Pageable pageable) {
        
        return RestApiResponse.success(houseService.getMyHouses(userInfo.getUserId(), pageable));
    }
    
    @Operation(
            summary = "숙소 삭제 API",
            description = "숙소를 소프트 삭제합니다. 실제로 데이터베이스에서 삭제하지 않고 isDelete 필드를 true로 설정합니다."
    )
    @PostMapping("/delete/{houseId}")
    public RestApiResponse<Void> deleteHouse(
            @PathVariable("houseId") Long houseId,
            @UserInfo UserInfoDto userInfo) {

        houseService.deleteHouse(houseId, userInfo.getUserId());
        return RestApiResponse.success(null);
    }
}
