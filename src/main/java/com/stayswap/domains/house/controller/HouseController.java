package com.stayswap.domains.house.controller;

import com.stayswap.domains.house.model.dto.request.CreateHouseRequest;
import com.stayswap.domains.house.model.dto.response.CreateHouseResponse;
import com.stayswap.domains.house.service.HouseService;
import com.stayswap.global.model.RestApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
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
            description = "숙소를 등록합니다."
    )
    @PostMapping("")
    public RestApiResponse<CreateHouseResponse> createHouse(
            @Valid @RequestPart CreateHouseRequest request,
            @RequestPart(required = false, value = "images") List<MultipartFile> images,
            BindingResult bindingResult) throws IOException {

        return RestApiResponse.success(
                houseService.createHouse(request, images));
    }





}
