package com.stayswap.domains.house.service;

import com.stayswap.domains.common.dto.response.FileUploadResponse;
import com.stayswap.domains.house.model.entity.House;
import com.stayswap.domains.house.model.entity.HouseImage;
import com.stayswap.domains.house.repository.HouseImageRepository;
import com.stayswap.global.error.exception.InvalidException;
import com.stayswap.global.util.FileUploadUtil;
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
public class HouseImgService {

    private final HouseImageRepository houseImageRepository;
    private final FileUploadUtil fileUploadUtil;

    /**
     * 이미지 업로드
     */
    public void uploadHouseImg(House house, List<MultipartFile> images) throws IOException {
        for (MultipartFile img : images) {
            if (!img.isEmpty()) {
                FileUploadResponse imgResponse = fileUploadUtil.uploadFile("image", img);
                houseImageRepository.save(HouseImage.newHouseImg(imgResponse.getFileUrl(), imgResponse.getFilePath(),house));
            }
        }
    }

    /**
     * 업로드 가능 파일 개수 검증
     */
    public void validateImgCount(List<MultipartFile> images, Long limit) {
        if (images.size() > limit) {
            throw new InvalidException(INVALID_FILE_COUNT_TOO_MANY);
        }
    }
    
    /**
     * 이미지 삭제
     */
    public void deleteHouseImages(House house) {
        List<HouseImage> images = houseImageRepository.findByHouse(house);
        if (!images.isEmpty()) {
            houseImageRepository.deleteAll(images);
        }
    }
}
