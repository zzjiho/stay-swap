package com.stayswap.house.model.dto.response;

import com.stayswap.house.constant.HouseType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class HouseDetailResponse {

    @Schema(description = "숙소 ID", example = "1")
    private Long houseId;

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

    @Schema(description = "한국어 도시명", example = "서울")
    private String cityKo;

    @Schema(description = "한국어 지역구", example = "강남구")
    private String districtKo;

    @Schema(description = "한국어 국가명", example = "대한민국")
    private String countryKo;

    @Schema(description = "한국어 상세 주소", example = "서울특별시 강남구 테헤란로 123, 456동 789호")
    private String addressKo;

    @Schema(description = "영어 도시명", example = "Seoul")
    private String cityEn;

    @Schema(description = "영어 지역구", example = "Gangnam-gu")
    private String districtEn;

    @Schema(description = "영어 국가명", example = "South Korea")
    private String countryEn;

    @Schema(description = "영어 상세 주소", example = "123 Teheran-ro, Gangnam-gu, Seoul, South Korea")
    private String addressEn;

    @Schema(description = "반려동물 허용 여부", example = "true")
    private Boolean petsAllowed;

    @Schema(description = "평균 평점", example = "4.5")
    private Double avgRating;

    @Schema(description = "리뷰 수", example = "10")
    private Long reviewCount;

    @Schema(description = "호스트 ID", example = "1")
    private Long hostId;

    @Schema(description = "편의시설 정보")
    private AmenityInfo amenities;

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

    @Schema(description = "사용자가 좋아요 누른 숙소 여부", example = "true")
    private Boolean isLiked;

    // 좋아요 상태 설정 메서드
    public void setIsLiked(Boolean isLiked) {
        this.isLiked = isLiked;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AmenityInfo {
        private Boolean hasFreeWifi;
        private Boolean hasAirConditioner;
        private Boolean hasTV;
        private Boolean hasWashingMachine;
        private Boolean hasKitchen;
        private Boolean hasDryer;
        private Boolean hasIron;
        private Boolean hasRefrigerator;
        private Boolean hasMicrowave;
        private Boolean hasFreeParking;
        private Boolean hasBalconyTerrace;
        private Boolean hasPetsAllowed;
        private Boolean hasSmokingAllowed;
        private Boolean hasElevator;
        private String otherAmenities;
        private String otherFeatures;
    }
}