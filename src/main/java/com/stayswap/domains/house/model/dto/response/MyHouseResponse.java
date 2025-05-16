package com.stayswap.domains.house.model.dto.response;

import com.stayswap.domains.house.constant.HouseType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyHouseResponse {
    private Long id;
    private String title;
    private String thumbnailUrl;
    private Double averageRating;
    private Long reviewCount;
    private LocalDateTime createdAt;
    
    public static MyHouseResponse of(Long id, String title, String thumbnailUrl, 
                                    Double averageRating, Long reviewCount, LocalDateTime createdAt) {
        return MyHouseResponse.builder()
                .id(id)
                .title(title)
                .thumbnailUrl(thumbnailUrl)
                .averageRating(averageRating)
                .reviewCount(reviewCount)
                .createdAt(createdAt)
                .build();
    }
} 