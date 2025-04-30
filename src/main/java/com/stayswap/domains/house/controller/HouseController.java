package com.stayswap.domains.house.controller;

import com.stayswap.domains.house.model.dto.request.CreateHouseRequest;
import com.stayswap.domains.house.model.dto.request.UpdateHouseRequest;
import com.stayswap.domains.house.model.dto.response.CreateHouseResponse;
import com.stayswap.domains.house.model.dto.response.UpdateHouseResponse;
import com.stayswap.domains.house.service.HouseService;
import com.stayswap.global.model.RestApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
    @PutMapping("/{houseId}")
    public RestApiResponse<UpdateHouseResponse> updateHouse(
            @PathVariable("houseId") Long houseId,
            @RequestParam("userId") Long userId,
            @Valid @RequestPart(value = "request") UpdateHouseRequest request,
            @RequestPart(required = false, value = "images") List<MultipartFile> images,
            BindingResult bindingResult) throws IOException {

        return RestApiResponse.success(
                houseService.updateHouse(houseId, userId, request, images));
    }
}
