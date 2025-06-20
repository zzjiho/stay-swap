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
public class ReceivedReviewResponse {
    private Long reviewId;
    private Long reviewerId; // 리뷰 작성자 ID
    private String reviewerName; // 리뷰 작성자 이름
    private String reviewerNickname; // 리뷰 작성자 닉네임
    private String reviewerProfile; // 리뷰 작성자 프로필 사진
    private Integer rating; // 평점
    private String comment; // 리뷰 내용
    private LocalDateTime createdDate; // 작성일
    private String houseTitle; // 숙소 제목
    private String houseId;
    
    public static ReceivedReviewResponse of(Review review) {
        return ReceivedReviewResponse.builder()
                .reviewId(review.getId())
                .reviewerId(review.getUser().getId())
                .reviewerName(review.getUser().getUserName())
                .reviewerNickname(review.getUser().getNickname())
                .reviewerProfile(review.getUser().getProfile())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdDate(review.getRegTime())
                .houseTitle(review.getTargetHouse().getTitle())
                .houseId(String.valueOf(review.getTargetHouse().getId()))
                .build();
    }
    
}