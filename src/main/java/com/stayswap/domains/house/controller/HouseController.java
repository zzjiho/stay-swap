package com.stayswap.domains.house.controller;

import com.stayswap.domains.house.constant.HouseType;
import com.stayswap.domains.house.model.dto.request.CreateHouseRequest;
import com.stayswap.domains.house.model.dto.request.HouseSearchRequest;
import com.stayswap.domains.house.model.dto.request.UpdateHouseRequest;
import com.stayswap.domains.house.model.dto.response.CreateHouseResponse;
import com.stayswap.domains.house.model.dto.response.HouseListResponse;
import com.stayswap.domains.house.model.dto.response.UpdateHouseResponse;
import com.stayswap.domains.house.service.HouseService;
import com.stayswap.global.model.RestApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/house")
@Tag(name = "house", description = "숙소(집) API")
public class HouseController {

    private final HouseService houseService;

    @Operation(
            summary = "숙소 등록 API",
            description = "숙소를 등록합니다." +
                    " 숙소 등록 시, 이미지 파일을 함께 최대 10장 업로드할 수 있습니다."
    )
    @PostMapping("")
    public RestApiResponse<CreateHouseResponse> createHouse(
            @RequestParam("userId") Long userId,
            @Valid @RequestPart(value = "request") CreateHouseRequest request,
            @RequestPart(required = false, value = "images") List<MultipartFile> images,
            BindingResult bindingResult) throws IOException {

        return RestApiResponse.success(
                houseService.createHouse(userId, request, images));
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
        
        return RestApiResponse.success(houseService.getHouseList(request, pageable));
    }
}
