package com.stayswap.house.model.dto.response;

import com.stayswap.house.constant.HouseType;
import com.stayswap.house.model.entity.House;
import io.swagger.v3.oas.annotations.media.Schema;
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
    
    private HouseType houseType;
    private Integer bedrooms;
    private Integer maxGuests;
    private LocalDateTime regTime;
    private String thumbnailUrl;
    
    public static RecentHouseResponse of(House house, String thumbnailUrl) {
        return RecentHouseResponse.builder()
                .id(house.getId())
                .title(house.getTitle())
                .addressKo(house.getAddressKo())
                .cityKo(house.getCityKo())
                .countryKo(house.getCountryKo())
                .districtKo(house.getDistrictKo())
                .addressEn(house.getAddressEn())
                .cityEn(house.getCityEn())
                .countryEn(house.getCountryEn())
                .districtEn(house.getDistrictEn())
                .houseType(house.getHouseType())
                .bedrooms(house.getBedrooms())
                .maxGuests(house.getMaxGuests())
                .regTime(house.getRegTime())
                .thumbnailUrl(thumbnailUrl)
                .build();
    }
} 