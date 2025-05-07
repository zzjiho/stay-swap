package com.stayswap.domains.house.model.dto.response;

import com.stayswap.domains.house.constant.HouseType;
import com.stayswap.domains.house.model.entity.House;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PopularHouseResponse {
    
    private Long houseId;
    private String title;
    private HouseType houseType;
    private String city;
    private String district;
    private Integer bedrooms;
    private Integer bed;
    private Integer maxGuests;
    private String thumbnailUrl;
    private Double rating;
    private Long reviewCount;
    
    public static PopularHouseResponse of(House house, String thumbnailUrl, Double rating, Long reviewCount) {
        return PopularHouseResponse.builder()
                .houseId(house.getId())
                .title(house.getTitle())
                .houseType(house.getHouseType())
                .city(house.getCity())
                .district(house.getDistrict())
                .bedrooms(house.getBedrooms())
                .bed(house.getBed())
                .maxGuests(house.getMaxGuests())
                .thumbnailUrl(thumbnailUrl)
                .rating(rating)
                .reviewCount(reviewCount)
                .build();
    }
} 