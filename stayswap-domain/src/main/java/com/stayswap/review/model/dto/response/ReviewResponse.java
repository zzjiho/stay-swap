package com.stayswap.review.model.dto.response;

import com.stayswap.review.model.entity.Review;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponse {
    
    private Long reviewId;
    private Long swapId;
    private Long userId;
    private Long targetHouseId;
    private Integer rating;
    private String comment;
    private LocalDateTime createdDate;
    
    public static ReviewResponse of(Review review) {
        return ReviewResponse.builder()
                .reviewId(review.getId())
                .swapId(review.getSwap().getId())
                .userId(review.getUser().getId())
                .targetHouseId(review.getTargetHouse().getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdDate(review.getRegTime())
                .build();
    }
} 