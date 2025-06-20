package com.stayswap.review.repository;

import com.stayswap.review.model.dto.response.ReceivedReviewResponse;
import com.stayswap.review.model.dto.response.WrittenReviewResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

public interface ReviewRepositoryCustom {
    Slice<WrittenReviewResponse> findWrittenReviewsWithQueryDsl(Long userId, Pageable pageable);
    
    Slice<ReceivedReviewResponse> findReceivedReviewsWithQueryDsl(Long userId, Pageable pageable);
}