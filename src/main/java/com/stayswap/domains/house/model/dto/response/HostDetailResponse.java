package com.stayswap.domains.house.model.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Schema(description = "호스트 상세 정보 DTO")
@NoArgsConstructor
@AllArgsConstructor
public class HostDetailResponse {

    @Schema(description = "호스트 ID", example = "1")
    private Long hostId;

    @Schema(description = "호스트 이름", example = "김민수")
    private String hostName;

    @Schema(description = "호스트 프로필 이미지", example = "https://example.com/profile.jpg")
    private String profileImage;

    @Schema(description = "가입 년도", example = "2020")
    private Integer joinedAt;

    @Schema(description = "호스트의 리뷰 수", example = "28")
    private Long reviewCount;
    
    @Schema(description = "호스트의 평점", example = "4.8")
    private Double avgRating;

    // 응답률, 슈퍼호스트 여부 아직 기획 미정
//    @Schema(description = "응답률", example = "98")
//    private Integer responseRate;
    
//    @Schema(description = "슈퍼호스트 여부", example = "true")
//    private Boolean isSuperHost;
}