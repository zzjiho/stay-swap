package com.stayswap.house.model.dto.response;

import com.stayswap.house.constant.HouseType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Schema(description = "숙소 상세 조회 DTO")
@NoArgsConstructor
@AllArgsConstructor
public class HouseDetailResponse {

    @Schema(description = "숙소(집) Id", example = "1")
    private Long houseId;

    @Schema(description = "숙소 제목", example = "서울 강남구의 아늑한 아파트")
    private String title;

    @Schema(description = "숙소 설명", example = "강남역에서 도보 5분 거리에 위치한 모던한 아파트입니다...")
    private String description;

    @Schema(description = "숙소 규칙", example = "흡연 금지, 파티 금지...")
    private String rule;

    @Schema(description = "숙소 유형", example = "APARTMENT")
    private HouseType houseType;

    @Schema(description = "크기(m²)", example = "80.5")
    private Float size;

    @Schema(description = "침실 수", example = "2")
    private Integer bedrooms;

    @Schema(description = "침대 수", example = "3")
    private Integer bed;

    @Schema(description = "욕실 수", example = "1")
    private Integer bathrooms;

    @Schema(description = "최대 숙박 인원", example = "4")
    private Integer maxGuests;

    @Schema(description = "도시", example = "서울시")
    private String city;

    @Schema(description = "지역구", example = "강남구")
    private String district;

    @Schema(description = "반려동물 허용 여부", example = "true")
    private Boolean petsAllowed;

    @Schema(description = "평점", example = "4.9")
    private Double avgRating;

    @Schema(description = "리뷰 수", example = "28")
    private Long reviewCount;

    @Schema(description = "호스트 ID", example = "1")
    private Long hostId;

    @Schema(description = "편의시설 정보")
    private AmenityInfo amenityInfo;

    @Getter
    @Schema(description = "편의시설 정보")
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AmenityInfo {
        @Schema(description = "무선 인터넷 제공 여부", example = "true")
        private boolean hasFreeWifi;

        @Schema(description = "에어컨 제공 여부", example = "true")
        private boolean hasAirConditioner;

        @Schema(description = "TV 제공 여부", example = "true")
        private boolean hasTV;

        @Schema(description = "세탁기 제공 여부", example = "true")
        private boolean hasWashingMachine;

        @Schema(description = "주방 제공 여부", example = "true")
        private boolean hasKitchen;

        @Schema(description = "건조기 제공 여부", example = "true")
        private boolean hasDryer;

        @Schema(description = "다리미 제공 여부", example = "true")
        private boolean hasIron;

        @Schema(description = "냉장고 제공 여부", example = "true")
        private boolean hasRefrigerator;

        @Schema(description = "전자레인지 제공 여부", example = "true")
        private boolean hasMicrowave;

        @Schema(description = "무료 주차 제공 여부", example = "true")
        private boolean hasFreeParking;

        @Schema(description = "발코니/테라스 제공 여부", example = "true")
        private boolean hasBalconyTerrace;

        @Schema(description = "반려동물 허용 여부", example = "true")
        private boolean hasPetsAllowed;

        @Schema(description = "흡연 허용 여부", example = "false")
        private boolean hasSmokingAllowed;

        @Schema(description = "엘리베이터 제공 여부", example = "true")
        private boolean hasElevator;

        @Schema(description = "기타 편의시설", example = "수영장, 헬스장")
        private String otherAmenities;

        @Schema(description = "기타 특징", example = "옥상 정원")
        private String otherFeatures;
    }
}