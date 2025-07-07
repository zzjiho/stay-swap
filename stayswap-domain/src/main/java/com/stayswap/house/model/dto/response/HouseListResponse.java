package com.stayswap.house.model.dto.response;

import com.stayswap.house.constant.HouseType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class HouseListResponse {

    @Schema(description = "숙소 ID", example = "1")
    private Long houseId;

    @Schema(description = "숙소 제목", example = "서울 강남 아늑한 아파트")
    private String title;

    @Schema(description = "숙소 유형", example = "APT")
    private HouseType houseType;

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

    @Schema(description = "침실 수", example = "2")
    private Integer bedrooms;

    @Schema(description = "침대 수", example = "3")
    private Integer bed;

    @Schema(description = "최대 수용 인원", example = "4")
    private Integer maxGuests;

    @Schema(description = "대표 이미지 URL", example = "https://example.com/image.jpg")
    private String mainImageUrl;

    @Schema(description = "평균 평점", example = "4.5")
    private Double avgRating;

    @Schema(description = "리뷰 수", example = "10")
    private Long reviewCount;

}