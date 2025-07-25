package com.stayswap.house.model.dto.request;

import com.stayswap.house.constant.HouseType;
import com.stayswap.house.model.entity.House;
import com.stayswap.house.model.entity.HouseOption;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PRIVATE)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class UpdateHouseRequest {

    @Schema(description = "숙소 제목", example = "서울 강남 아늑한 아파트")
    private String title;

    @Schema(description = "숙소 설명", example = "강남역 5분 거리에 위치한 깨끗하고 아늑한 2베드룸 아파트입니다. 편의시설이 잘 갖추어져 있으며 주변에 맛집이 많습니다.")
    private String description;

    @Schema(description = "숙소 이용 규칙", example = "뛰어다니지 마세요!")
    private String rule;

    @Schema(description = "숙소 유형", example = "APT")
    private HouseType houseType;

    @Schema(description = "숙소 크기(평방미터)", example = "85.5")
    private Float size;

    @Schema(description = "침실 수", example = "2")
    private Integer bedrooms;

    @Schema(description = "침대 수", example = "3")
    private Integer bed;

    @Schema(description = "욕실 수", example = "1")
    private Integer bathrooms;

    @Schema(description = "최대 수용 인원", example = "4")
    private Integer maxGuests;

    @Schema(description = "한국어 상세 주소", example = "서울특별시 강남구 테헤란로 123, 456동 789호")
    private String addressKo;

    @Schema(description = "한국어 도시명", example = "서울")
    private String cityKo;

    @Schema(description = "한국어 지역구", example = "강남구")
    private String districtKo;

    @Schema(description = "한국어 국가명", example = "대한민국")
    private String countryKo;

    @Schema(description = "영어 상세 주소", example = "123 Teheran-ro, Gangnam-gu, Seoul, South Korea")
    private String addressEn;

    @Schema(description = "영어 도시명", example = "Seoul")
    private String cityEn;

    @Schema(description = "영어 지역구", example = "Gangnam-gu")
    private String districtEn;

    @Schema(description = "영어 국가명", example = "South Korea")
    private String countryEn;

    @Schema(description = "위도", example = "37.5665")
    private Double latitude;

    @Schema(description = "경도", example = "126.9780")
    private Double longitude;

    @Schema(description = "지도 영역 북동쪽 위도", example = "37.5670")
    private Double viewportNortheastLat;

    @Schema(description = "지도 영역 북동쪽 경도", example = "126.9785")
    private Double viewportNortheastLng;

    @Schema(description = "지도 영역 남서쪽 위도", example = "37.5660")
    private Double viewportSouthwestLat;

    @Schema(description = "지도 영역 남서쪽 경도", example = "126.9775")
    private Double viewportSouthwestLng;

    @Schema(description = "반려동물 허용 여부", example = "true")
    private Boolean petsAllowed;
    
    @Schema(description = "삭제할 이미지 ID 목록", example = "[1, 2, 3]")
    private List<Long> deleteImageIds;
    
    @Schema(description = "숙소 옵션 정보")
    private HouseOptionRequest options;
    
    @Getter
    @Builder
    @NoArgsConstructor(access = AccessLevel.PRIVATE)
    @AllArgsConstructor(access = AccessLevel.PRIVATE)
    public static class HouseOptionRequest {

        @Schema(description = "무료 와이파이 제공 여부", example = "true")
        private Boolean hasFreeWifi;
        
        @Schema(description = "에어컨 구비 여부", example = "true")
        private Boolean hasAirConditioner;
        
        @Schema(description = "TV 구비 여부", example = "true")
        private Boolean hasTV;
        
        @Schema(description = "세탁기 구비 여부", example = "true")
        private Boolean hasWashingMachine;
        
        @Schema(description = "부엌 구비 여부", example = "true")
        private Boolean hasKitchen;
        
        @Schema(description = "건조기 구비 여부", example = "false")
        private Boolean hasDryer;
        
        @Schema(description = "다리미 구비 여부", example = "true")
        private Boolean hasIron;
        
        @Schema(description = "냉장고 구비 여부", example = "true")
        private Boolean hasRefrigerator;
        
        @Schema(description = "전자레인지 구비 여부", example = "true")
        private Boolean hasMicrowave;
        
        @Schema(description = "기타 편의시설", example = "커피머신, 토스터기")
        private String otherAmenities;

        @Schema(description = "무료 주차 가능 여부", example = "true")
        private Boolean hasFreeParking;
        
        @Schema(description = "발코니/테라스 여부", example = "true")
        private Boolean hasBalconyTerrace;
        
        @Schema(description = "반려동물 허용 여부", example = "true")
        private Boolean hasPetsAllowed;
        
        @Schema(description = "흡연 허용 여부", example = "false")
        private Boolean hasSmokingAllowed;
        
        @Schema(description = "엘리베이터 구비 여부", example = "true")
        private Boolean hasElevator;
        
        @Schema(description = "기타 특징", example = "24시간 경비, 수영장 이용 가능")
        private String otherFeatures;
        
        public HouseOption toEntity() {
            return HouseOption.builder()
                    .hasFreeWifi(hasFreeWifi)
                    .hasAirConditioner(hasAirConditioner)
                    .hasTV(hasTV)
                    .hasWashingMachine(hasWashingMachine)
                    .hasKitchen(hasKitchen)
                    .hasDryer(hasDryer)
                    .hasIron(hasIron)
                    .hasRefrigerator(hasRefrigerator)
                    .hasMicrowave(hasMicrowave)
                    .otherAmenities(otherAmenities)
                    .hasFreeParking(hasFreeParking)
                    .hasBalconyTerrace(hasBalconyTerrace)
                    .hasPetsAllowed(hasPetsAllowed)
                    .hasSmokingAllowed(hasSmokingAllowed)
                    .hasElevator(hasElevator)
                    .otherFeatures(otherFeatures)
                    .build();
        }
    }
    
    public void updateEntity(House house) {
        house.update(
            title,
            description,
            rule,
            houseType,
            size,
            bedrooms,
            bed,
            bathrooms,
            maxGuests,
            addressKo,
            cityKo,
            districtKo,
            countryKo,
            addressEn,
            cityEn,
            districtEn,
            countryEn,
            latitude,
            longitude,
            viewportNortheastLat,
            viewportNortheastLng,
            viewportSouthwestLat,
            viewportSouthwestLng,
            petsAllowed,
            options != null ? options.toEntity() : null
        );
    }
} 