package com.stayswap.house.service;

import com.stayswap.error.exception.ForbiddenException;
import com.stayswap.error.exception.NotFoundException;
import com.stayswap.house.model.dto.request.CreateHouseRequest;
import com.stayswap.house.model.dto.request.HouseSearchRequest;
import com.stayswap.house.model.dto.request.UpdateHouseRequest;
import com.stayswap.house.model.dto.response.*;
import com.stayswap.house.model.entity.House;
import com.stayswap.house.repository.HouseRepository;
import com.stayswap.user.model.entity.User;
import com.stayswap.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

import static com.stayswap.code.ErrorCode.*;


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

    // 등록된 숙소들의 국가 목록 조회
    @Transactional(readOnly = true)
    public List<CountryResponse> getDistinctCountries() {
        return houseRepository.getDistinctCountries();
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
    
    // 내 숙소 목록 조회
    @Transactional(readOnly = true)
    public Slice<MyHouseResponse> getMyHouses(Long userId, Pageable pageable) {
        if (!userRepository.existsById(userId)) {
            throw new NotFoundException(NOT_EXISTS_USER);
        }
        
        return houseRepository.getMyHouses(userId, pageable);
    }
    
    // 좋아요 누른 숙소 목록 조회
    @Transactional(readOnly = true)
    public Slice<MyHouseResponse> getLikedHouses(Long userId, Pageable pageable) {
        if (!userRepository.existsById(userId)) {
            throw new NotFoundException(NOT_EXISTS_USER);
        }
        
        return houseRepository.getLikedHouses(userId, pageable);
    }
    
    // 숙소 삭제
    public void deleteHouse(Long houseId, Long userId) {
        House house = houseRepository.findById(houseId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_HOUSE));
                
        if (!house.getUser().getId().equals(userId)) {
            throw new ForbiddenException(NOT_AUTHORIZED);
        }
        
        house.delete();
        
        // 캐시 무효화
        houseRedisService.invalidateRecentHousesCache();
        houseRedisService.invalidatePopularHousesCache();
    }

    // 숙소 활성화/비활성화
    public UpdateHouseStatusResponse updateHouseStatus(Long houseId, Long userId, Boolean active) {

        House house = houseRepository.findById(houseId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_HOUSE));
                
        if (!house.getUser().getId().equals(userId)) {
            throw new ForbiddenException(NOT_AUTHORIZED);
        }
        
        house.updateActiveStatus(active);
        
        if (active != house.getIsActive()) {
            houseRedisService.invalidateRecentHousesCache();
            houseRedisService.invalidatePopularHousesCache();
        }
        
        return UpdateHouseStatusResponse.of(house.getId(), house.getIsActive());
    }
}
