package com.stayswap.domains.review.service;

import com.stayswap.domains.review.model.dto.request.ReviewRequest;
import com.stayswap.domains.review.model.dto.response.ReviewResponse;

public interface ReviewService {
    ReviewResponse createReview(Long userId, ReviewRequest request);
} 