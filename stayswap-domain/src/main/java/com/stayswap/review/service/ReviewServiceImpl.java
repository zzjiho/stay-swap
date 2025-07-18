package com.stayswap.review.service;

import com.stayswap.error.exception.BusinessException;
import com.stayswap.error.exception.ForbiddenException;
import com.stayswap.error.exception.NotFoundException;
import com.stayswap.house.model.entity.House;
import com.stayswap.house.repository.HouseImageRepository;
import com.stayswap.house.repository.HouseRepository;
import com.stayswap.house.service.HouseImgService;
import com.stayswap.house.service.HouseRedisService;
import com.stayswap.review.model.dto.request.ReviewRequest;
import com.stayswap.review.model.dto.response.HouseReviewResponse;
import com.stayswap.review.model.dto.response.ReceivedReviewResponse;
import com.stayswap.review.model.dto.response.ReviewResponse;
import com.stayswap.review.model.dto.response.WrittenReviewResponse;
import com.stayswap.review.model.entity.Review;
import com.stayswap.review.repository.ReviewRepository;
import com.stayswap.swap.constant.SwapStatus;
import com.stayswap.swap.model.entity.Swap;
import com.stayswap.swap.repository.SwapRepository;
import com.stayswap.user.model.entity.User;
import com.stayswap.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.stayswap.code.ErrorCode.*;


@Service
@Transactional
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final SwapRepository swapRepository;
    private final UserRepository userRepository;
    private final HouseRepository houseRepository;
    private final HouseRedisService houseRedisService;
    private final HouseImageRepository houseImageRepository;
    private final HouseImgService houseImgService;

    @Override
    public ReviewResponse createReview(Long userId, ReviewRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));

        Swap swap = swapRepository.findById(request.getSwapId())
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_SWAP_REQUEST));

        if (swap.getSwapStatus() != SwapStatus.COMPLETED) {
            throw new BusinessException(NOT_COMPLETED_SWAP);
        }

        // 자신의 스왑인지 검증 (요청자이거나 숙소 주인이어야 함)
        boolean isRequester = swap.getRequester().getId().equals(userId);
        boolean isTargetHouseOwner = swap.getHouse().getUser() != null && 
                                    swap.getHouse().getUser().getId().equals(userId);

        if (!isRequester && !isTargetHouseOwner) {
            throw new ForbiddenException(NOT_AUTHORIZED);
        }

        // 사용자의 입장 기준으로 상대방 숙소를 리뷰
        House targetHouse;
        if (isRequester) {
            targetHouse = swap.getHouse();
        } else {
            if (swap.getRequesterHouseId() == null) {
                // STAY 타입인 경우 요청자 숙소는 없음 (리뷰 불가)
                throw new BusinessException(NOT_EXISTS_SWAP_HOUSE);
            }
            targetHouse = swap.getRequesterHouseId();
        }

        if (reviewRepository.existsBySwapAndUserAndTargetHouse(swap, user, targetHouse)) {
            throw new BusinessException(ALREADY_REGISTED_REVIEW);
        }

        if (targetHouse.getUser() != null && targetHouse.getUser().getId().equals(userId)) {
            throw new BusinessException(CANNOT_REVIEW_OWN_HOUSE);
        }

        Review review = request.toEntity(user, swap, targetHouse);
        Review savedReview = reviewRepository.save(review);
        
        // 인기 숙소 캐시 무효화
        houseRedisService.invalidatePopularHousesCache();

        return ReviewResponse.of(savedReview);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Slice<ReceivedReviewResponse> getReceivedReviews(Long userId, Pageable pageable) {
        userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));
        
        return reviewRepository.findReceivedReviewsWithQueryDsl(userId, pageable);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Slice<WrittenReviewResponse> getWrittenReviews(Long userId, Pageable pageable) {
        userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));
        
        return reviewRepository.findWrittenReviewsWithQueryDsl(userId, pageable);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Slice<HouseReviewResponse> getHouseReviews(Long houseId, Pageable pageable) {
        houseRepository.findById(houseId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_HOUSE));
        
        return reviewRepository.findHouseReviewsWithQueryDsl(houseId, pageable);
    }
}