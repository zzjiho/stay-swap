package com.stayswap.domains.house.service;

import com.stayswap.domains.house.model.dto.request.CreateHouseRequest;
import com.stayswap.domains.house.model.dto.request.UpdateHouseRequest;
import com.stayswap.domains.house.model.dto.response.CreateHouseResponse;
import com.stayswap.domains.house.model.dto.response.UpdateHouseResponse;
import com.stayswap.domains.house.model.entity.House;
import com.stayswap.domains.house.repository.HouseRepository;
import com.stayswap.domains.user.model.entity.User;
import com.stayswap.domains.user.repository.UserRepository;
import com.stayswap.global.code.ErrorCode;
import com.stayswap.global.error.exception.ForbiddenException;
import com.stayswap.global.error.exception.NotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
        
        return UpdateHouseResponse.of(house);
    }
}
