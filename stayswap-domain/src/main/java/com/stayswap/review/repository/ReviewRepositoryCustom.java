package com.stayswap.review.repository;

import com.stayswap.review.model.dto.response.WrittenReviewResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReviewRepositoryCustom {
    Page<WrittenReviewResponse> findWrittenReviewsWithQueryDsl(Long userId, Pageable pageable);
}