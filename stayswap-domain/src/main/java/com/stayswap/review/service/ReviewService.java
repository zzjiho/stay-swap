package com.stayswap.review.service;

import com.stayswap.review.model.dto.request.ReviewRequest;
import com.stayswap.review.model.dto.response.ReceivedReviewResponse;
import com.stayswap.review.model.dto.response.ReviewResponse;
import com.stayswap.review.model.dto.response.WrittenReviewResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReviewService {
    ReviewResponse createReview(Long userId, ReviewRequest request);
    
    // 내가 받은 리뷰 목록 조회
    Page<ReceivedReviewResponse> getReceivedReviews(Long userId, Pageable pageable);
    
    // 내가 작성한 리뷰 목록 조회
    Page<WrittenReviewResponse> getWrittenReviews(Long userId, Pageable pageable);
} 