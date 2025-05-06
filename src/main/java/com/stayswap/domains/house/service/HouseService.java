package com.stayswap.domains.house.service;

import com.stayswap.domains.house.model.dto.request.CreateHouseRequest;
import com.stayswap.domains.house.model.dto.request.HouseSearchRequest;
import com.stayswap.domains.house.model.dto.request.UpdateHouseRequest;
import com.stayswap.domains.house.model.dto.response.CreateHouseResponse;
import com.stayswap.domains.house.model.dto.response.HouseDetailResponse;
import com.stayswap.domains.house.model.dto.response.HostDetailResponse;
import com.stayswap.domains.house.model.dto.response.HouseListResponse;
import com.stayswap.domains.house.model.dto.response.UpdateHouseResponse;
import com.stayswap.domains.house.model.dto.response.HouseImageResponse;
import com.stayswap.domains.house.model.entity.House;
import com.stayswap.domains.house.repository.HouseRepository;
import com.stayswap.domains.user.model.entity.User;
import com.stayswap.domains.user.repository.UserRepository;
import com.stayswap.global.code.ErrorCode;
import com.stayswap.global.error.exception.ForbiddenException;
import com.stayswap.global.error.exception.NotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

import static com.stayswap.global.code.ErrorCode.*;

@Service
@Transactional
@RequiredArgsConstructor
public class HouseService {

    private final HouseRepository houseRepository;
    private final HouseImgService houseImgService;
    private final UserRepository userRepository;
    private final HouseRedisService houseRedisService;

    // 숙소 등록
    public CreateHouseResponse createHouse(Long userId,
                                           @Valid CreateHouseRequest request,
                                           List<MultipartFile> images) throws IOException {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));

        House savedHouse = houseRepository.save(request.toEntity(user, request.getHouseType()));

        if (images != null) {
            houseImgService.validateImgCount(images, 10L);
            houseImgService.uploadHouseImg(savedHouse, images);
        }
        
        houseRedisService.invalidateRecentHousesCache();

        return CreateHouseResponse.of(savedHouse);
    }
    
    // 숙소 수정
    public UpdateHouseResponse updateHouse(Long houseId, Long userId,
                                           @Valid UpdateHouseRequest request,
                                           List<MultipartFile> images) throws IOException {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));
                
        House house = houseRepository.findById(houseId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_HOUSE));
                
        if (!house.getUser().getId().equals(userId)) {
            throw new ForbiddenException(NOT_AUTHORIZED);
        }
        
        request.updateEntity(house);
        
        if (images != null || (request.getDeleteImageIds() != null && !request.getDeleteImageIds().isEmpty())) {
            if (images != null) {
                houseImgService.validateImgCount(images, 10L);
            }
            houseImgService.updateSelectiveImg(house, request.getDeleteImageIds(), images);
        }
        
        houseRedisService.invalidateRecentHousesCache();
        
        return UpdateHouseResponse.of(house);
    }

    // 숙소 목록 조회
    @Transactional(readOnly = true)
    public Page<HouseListResponse> getHouseList(HouseSearchRequest request, Pageable pageable) {
        return houseRepository.getHouseList(request, pageable);
    }

    // 숙소 상세 정보 조회
    @Transactional(readOnly = true)
    public HouseDetailResponse getHouseDetail(Long houseId) {
        HouseDetailResponse houseDetail = houseRepository.getHouseDetail(houseId);
        
        if (houseDetail == null) {
            throw new NotFoundException(NOT_EXISTS_HOUSE);
        }
        
        return houseDetail;
    }

    // 호스트 조회
    @Transactional(readOnly = true)
    public HostDetailResponse getHostDetailByHouseId(Long houseId) {

        if (!houseRepository.existsById(houseId)) {
            throw new NotFoundException(NOT_EXISTS_HOUSE);
        }
        
        Long hostId = houseRepository.getHostIdByHouseId(houseId);
        if (hostId == null) {
            throw new NotFoundException(NOT_EXISTS_USER);
        }
        
        HostDetailResponse hostDetail = houseRepository.getHostDetailById(hostId);
        if (hostDetail == null) {
            throw new NotFoundException(NOT_EXISTS_USER);
        }
        
        return hostDetail;
    }

    // 숙소 이미지 조회
    @Transactional(readOnly = true)
    public List<HouseImageResponse> getHouseImages(Long houseId) {

        if (!houseRepository.existsById(houseId)) {
            throw new NotFoundException(NOT_EXISTS_HOUSE);
        }
        
        return houseRepository.getHouseImages(houseId);
    }
}
