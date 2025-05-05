package com.stayswap.domains.house.model.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Schema(description = "숙소 이미지 조회 DTO")
@NoArgsConstructor
@AllArgsConstructor
public class HouseImageResponse {

    @Schema(description = "이미지 ID", example = "1")
    private Long imageId;

    @Schema(description = "이미지 URL", example = "https://example.com/image.jpg")
    private String imageUrl;

    @Schema(description = "숙소 ID", example = "1")
    private Long houseId;
} 