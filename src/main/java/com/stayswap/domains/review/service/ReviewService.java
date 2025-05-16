package com.stayswap.domains.review.service;

import com.stayswap.domains.review.model.dto.request.ReviewRequest;
import com.stayswap.domains.review.model.dto.response.ReceivedReviewResponse;
import com.stayswap.domains.review.model.dto.response.ReviewResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReviewService {
    ReviewResponse createReview(Long userId, ReviewRequest request);
    
    // 내가 받은 리뷰 목록 조회
    Page<ReceivedReviewResponse> getReceivedReviews(Long userId, Pageable pageable);
} 