package com.stayswap.house.model.dto.request;

import com.stayswap.house.constant.HouseType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "숙소 검색 요청 DTO")
public class HouseSearchRequest {

    @Schema(description = "검색어 (숙소명, 주소 포함 검색)", example = "강남")
    private String keyword;

    @Schema(description = "도시", example = "서울")
    private String city;

    @Schema(description = "국가", example = "대한민국")
    private String country;

    @Schema(description = "숙소 유형", example = "APT")
    private HouseType houseType;

    @Schema(description = "날짜", example = "2023-06-01")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate date;

    @Schema(description = "편의시설 목록", example = "[\"WIFI\", \"PARKING\"]")
    private List<String> amenities;

    @Schema(description = "정렬 기준", example = "rating", allowableValues = {"recommended", "price_low", "price_high", "rating"})
    private String sortBy;
}