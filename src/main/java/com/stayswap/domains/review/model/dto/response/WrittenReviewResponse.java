package com.stayswap.domains.review.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WrittenReviewResponse {
    private Long reviewId;
    private Long houseId; // 리뷰 대상 숙소 ID
    private String houseName; // 리뷰 대상 숙소 이름
    private String houseImage; // 리뷰 대상 숙소 이미지
    private Integer rating; // 평점
    private String comment; // 리뷰 내용
    private LocalDateTime createdDate; // 작성일
}