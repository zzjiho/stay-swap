package com.stayswap.review.model.dto.request;

import com.stayswap.house.model.entity.House;
import com.stayswap.review.model.entity.Review;
import com.stayswap.swap.model.entity.Swap;
import com.stayswap.user.model.entity.User;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ReviewRequest {

    @NotNull(message = "스왑 ID는 필수값입니다.")
    private Long swapId;

    @NotNull(message = "평점은 필수값입니다.")
    @Min(value = 1, message = "평점은 최소 1점 이상이어야 합니다.")
    @Max(value = 5, message = "평점은 최대 5점까지 가능합니다.")
    private Integer rating;

    private String comment;

    public Review toEntity(User user, Swap swap, House targetHouse) {
        return Review.builder()
                .rating(this.rating)
                .comment(this.comment)
                .swap(swap)
                .user(user)
                .targetHouse(targetHouse)
                .build();
    }
} 