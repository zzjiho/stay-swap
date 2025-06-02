package com.stayswap.house.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HouseLikeResponse {
    
    private boolean isLiked;
    
    public static HouseLikeResponse of(boolean isLiked) {
        return HouseLikeResponse.builder()
                .isLiked(isLiked)
                .build();
    }
} 