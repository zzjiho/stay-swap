package com.stayswap.review.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HouseReviewResponse {
    private Long reviewId;
    private Long reviewerId; // 리뷰 작성자 ID
    private String reviewerNickname; // 리뷰 작성자 닉네임
    private String reviewerProfile; // 리뷰 작성자 프로필 사진
    private Integer rating; // 평점
    private String comment; // 리뷰 내용
    private LocalDateTime createdDate; // 작성일
} 