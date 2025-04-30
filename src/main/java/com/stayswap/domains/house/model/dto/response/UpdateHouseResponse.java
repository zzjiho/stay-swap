package com.stayswap.domains.house.model.dto.response;

import com.stayswap.domains.house.model.entity.House;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class UpdateHouseResponse {

    @Schema(description = "수정된 숙소(집) Id", example = "1")
    private Long houseId;

    public static UpdateHouseResponse of(House house) {
        return new UpdateHouseResponse(house.getId());
    }
} 