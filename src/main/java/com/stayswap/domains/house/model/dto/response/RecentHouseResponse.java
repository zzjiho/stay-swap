package com.stayswap.domains.house.model.dto.response;

import com.stayswap.domains.house.constant.HouseType;
import com.stayswap.domains.house.model.entity.House;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RecentHouseResponse {
    private Long id;
    private String title;
    private String city;
    private String district;
    private HouseType houseType;
    private Integer bedrooms;
    private Integer maxGuests;
    private LocalDateTime regTime;
    private String thumbnailUrl;
    
    public static RecentHouseResponse of(House house, String thumbnailUrl) {
        return RecentHouseResponse.builder()
                .id(house.getId())
                .title(house.getTitle())
                .city(house.getCity())
                .district(house.getDistrict())
                .houseType(house.getHouseType())
                .bedrooms(house.getBedrooms())
                .maxGuests(house.getMaxGuests())
                .regTime(house.getRegTime())
                .thumbnailUrl(thumbnailUrl)
                .build();
    }
} 