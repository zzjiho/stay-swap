package com.stayswap.domains.house.model.dto.response;

import com.querydsl.core.annotations.QueryProjection;
import com.stayswap.domains.house.constant.HouseType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;

@Getter
@Schema(description = "숙소 목록 조회 DTO")
public class HouseListResponse {

    @Schema(description = "숙소(집) Id", example = "1")
    private Long houseId;

    @Schema(description = "숙소 제목", example = "서울 강남구의 아늑한 아파트")
    private String title;

    @Schema(description = "숙소 유형", example = "APARTMENT")
    private HouseType houseType;

    @Schema(description = "도시", example = "서울시")
    private String city;

    @Schema(description = "지역구", example = "강남구")
    private String district;

    @Schema(description = "침실 수", example = "2")
    private Integer bedrooms;

    @Schema(description = "침대 수", example = "3")
    private Integer bed;

    @Schema(description = "최대 숙박 인원", example = "4")
    private Integer maxGuests;

    @Schema(description = "대표 이미지 URL", example = "https://example.com/image.jpg")
    private String mainImageUrl;

    @Schema(description = "평점", example = "4.5")
    private Double avgRating;

    @Schema(description = "리뷰 수", example = "100")
    private Long reviewCount;

    @QueryProjection
    public HouseListResponse(Long houseId, String title, HouseType houseType, String city, String district, 
                           Integer bedrooms, Integer bed, Integer maxGuests, String mainImageUrl, 
                           Double avgRating, Long reviewCount) {
        this.houseId = houseId;
        this.title = title;
        this.houseType = houseType;
        this.city = city;
        this.district = district;
        this.bedrooms = bedrooms;
        this.bed = bed;
        this.maxGuests = maxGuests;
        this.mainImageUrl = mainImageUrl;
        this.avgRating = avgRating;
        this.reviewCount = reviewCount;
    }
} 