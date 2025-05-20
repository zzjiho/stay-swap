package com.stayswap.domains.review.repository;

import com.stayswap.domains.review.model.dto.response.WrittenReviewResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReviewRepositoryCustom {
    Page<WrittenReviewResponse> findWrittenReviewsWithQueryDsl(Long userId, Pageable pageable);
}