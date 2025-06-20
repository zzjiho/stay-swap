package com.stayswap.house.model.dto.response;

import com.stayswap.house.constant.HouseType;
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
    private boolean active;
    private String houseType;
    
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
    
    public MyHouseResponse(Long id, String title, String thumbnailUrl, Double averageRating, 
                          Long reviewCount, LocalDateTime createdAt, Boolean active, HouseType houseType) {
        this.id = id;
        this.title = title;
        this.thumbnailUrl = thumbnailUrl;
        this.averageRating = averageRating;
        this.reviewCount = reviewCount;
        this.createdAt = createdAt;
        this.active = active != null ? active : false;
        this.houseType = houseType != null ? houseType.name() : null;
    }
} 