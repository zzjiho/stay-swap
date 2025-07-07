package com.stayswap.house.model.dto.response;

import com.stayswap.house.constant.HouseType;
import com.stayswap.house.model.entity.House;
import io.swagger.v3.oas.annotations.media.Schema;
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

    // 다국어 지원 필드들
    private String addressKo;
    @Schema(description = "한국어 도시명", example = "서울")
    private String cityKo;
    private String districtKo;
    private String addressEn;
    @Schema(description = "영어 도시명", example = "Seoul")
    private String cityEn;
    private String districtEn;
    @Schema(description = "한국어 국가명", example = "대한민국")
    private String countryKo;
    @Schema(description = "영어 국가명", example = "South Korea")
    private String countryEn;
    
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
                .addressKo(house.getAddressKo())
                .cityKo(house.getCityKo())
                .countryKo(house.getCountryKo())
                .districtKo(house.getDistrictKo())
                .addressEn(house.getAddressEn())
                .cityEn(house.getCityEn())
                .countryEn(house.getCountryEn())
                .districtEn(house.getDistrictEn())
                .bedrooms(house.getBedrooms())
                .bed(house.getBed())
                .maxGuests(house.getMaxGuests())
                .thumbnailUrl(thumbnailUrl)
                .rating(rating)
                .reviewCount(reviewCount)
                .build();
    }
} 