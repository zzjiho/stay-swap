package com.stayswap.review.service;

import com.stayswap.review.model.dto.request.ReviewRequest;
import com.stayswap.review.model.dto.response.HouseReviewResponse;
import com.stayswap.review.model.dto.response.ReceivedReviewResponse;
import com.stayswap.review.model.dto.response.ReviewResponse;
import com.stayswap.review.model.dto.response.WrittenReviewResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

public interface ReviewService {
    ReviewResponse createReview(Long userId, ReviewRequest request);
    
    // 내가 받은 리뷰 목록 조회
    Slice<ReceivedReviewResponse> getReceivedReviews(Long userId, Pageable pageable);
    
    // 내가 작성한 리뷰 목록 조회
    Slice<WrittenReviewResponse> getWrittenReviews(Long userId, Pageable pageable);
    
    // 특정 숙소의 리뷰 목록 조회
    Slice<HouseReviewResponse> getHouseReviews(Long houseId, Pageable pageable);
} 