package com.stayswap.house.service;

import com.stayswap.error.exception.NotFoundException;
import com.stayswap.house.model.entity.House;
import com.stayswap.house.model.entity.HouseLike;
import com.stayswap.house.repository.HouseLikeRepository;
import com.stayswap.house.repository.HouseRepository;
import com.stayswap.notification.service.domain.house.HouseLikeNotificationService;
import com.stayswap.user.model.entity.User;
import com.stayswap.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.stayswap.code.ErrorCode.NOT_EXISTS_HOUSE;
import static com.stayswap.code.ErrorCode.NOT_EXISTS_USER;

@Service
@Transactional
@RequiredArgsConstructor
public class HouseLikeService {

    private final HouseLikeRepository houseLikeRepository;
    private final HouseRepository houseRepository;
    private final UserRepository userRepository;
    private final HouseLikeNotificationService houseLikeNotificationService;

    /**
     * 숙소 좋아요 등록
     */
    public boolean addLike(Long houseId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));
        
        House house = houseRepository.findById(houseId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_HOUSE));
        
        if (houseLikeRepository.existsByUserAndHouse(user, house)) {
            return false;
        }
        
        HouseLike houseLike = HouseLike.of(user, house);
        houseLikeRepository.save(houseLike);
        
        houseLikeNotificationService.createHouseLikeAddedNotification(
                house.getUser().getId(),
                userId,
                houseId
        );
        
        return true;
    }

    /**
     * 숙소 좋아요 취소
     */
    public boolean cancelLike(Long houseId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));

        House house = houseRepository.findById(houseId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_HOUSE));
        
        HouseLike houseLike = houseLikeRepository.findByUserAndHouse(user, house)
                .orElse(null);
        
        // 좋아요가 없으면 취소할 수 없음
        if (houseLike == null) {
            return false;
        }
        
        houseLikeRepository.delete(houseLike);
        
        houseLikeNotificationService.createHouseLikeRemovedNotification(
                house.getUser().getId(),
                userId,
                houseId
        );
        
        return true;
    }
    
    /**
     * 숙소 좋아요 상태 조회
     */
    @Transactional(readOnly = true)
    public boolean isLiked(Long houseId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));

        House house = houseRepository.findById(houseId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_HOUSE));
        
        return houseLikeRepository.existsByUserAndHouse(user, house);
    }
} 