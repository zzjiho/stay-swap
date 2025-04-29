package com.stayswap.domains.house.service;

import com.stayswap.domains.house.model.dto.request.CreateHouseRequest;
import com.stayswap.domains.house.model.dto.response.CreateHouseResponse;
import com.stayswap.domains.house.model.entity.House;
import com.stayswap.domains.house.repository.HouseRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class HouseService {

    private final HouseRepository houseRepository;
    private final HouseImgService houseImgService;

    // 숙소 등록
    public CreateHouseResponse createHouse(@Valid CreateHouseRequest request, List<MultipartFile> images) throws IOException {

        House savedHouse = houseRepository.save(request.toEntity());

        if (images != null) {
            houseImgService.validateImgCount(images, 5L);
            houseImgService.uploadHouseImg(savedHouse, images);
        }

        return CreateHouseResponse.of(savedHouse);
    }
}
