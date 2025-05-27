package com.stayswap.house.service;

import com.stayswap.common.dto.response.FileUploadResponse;
import com.stayswap.error.exception.InvalidException;
import com.stayswap.error.exception.NotFoundException;
import com.stayswap.house.model.entity.House;
import com.stayswap.house.model.entity.HouseImage;
import com.stayswap.house.repository.HouseImageRepository;
import com.stayswap.util.FileUploadUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

import static com.stayswap.code.ErrorCode.INVALID_FILE_COUNT_TOO_MANY;
import static com.stayswap.code.ErrorCode.NOT_EXISTS_HOUSE;


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
     * 특정 이미지 삭제
     */
    public void deleteImage(Long imageId) {
        HouseImage image = houseImageRepository.findById(imageId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_HOUSE));
        
        // S3에서 파일 삭제
        fileUploadUtil.deleteFile(image.getPath());
        
        // DB에서 이미지 정보 삭제
        houseImageRepository.delete(image);
    }

    /**
     * 선택적 이미지 수정 (일부 삭제 및 새 이미지 추가)
     */
    public void updateSelectiveImg(House house, List<Long> deleteImageIds, List<MultipartFile> newImages) throws IOException {
        // 1. 삭제할 이미지 처리
        if (deleteImageIds != null && !deleteImageIds.isEmpty()) {
            for (Long imageId : deleteImageIds) {
                deleteImage(imageId);
            }
        }
        
        // 2. 새 이미지 추가
        if (newImages != null && !newImages.isEmpty()) {
            // 현재 이미지 수 확인 (삭제 후)
            List<HouseImage> currentImages = houseImageRepository.findByHouse(house);
            int currentImgCount = currentImages.size();
            
            // 총 이미지 수 검증
            if (currentImgCount + newImages.size() > 10) {
                throw new InvalidException(INVALID_FILE_COUNT_TOO_MANY);
            }
            
            // 새 이미지 업로드
            uploadHouseImg(house, newImages);
        }
    }

    /**
     * 숙소에 속한 이미지 URL 목록 조회
     */
    @Transactional(readOnly = true)
    public List<String> getHouseImageUrls(Long houseId) {
        return houseImageRepository.findByHouseId(houseId).stream()
                .map(HouseImage::getImageUrl)
                .toList();
    }
}
