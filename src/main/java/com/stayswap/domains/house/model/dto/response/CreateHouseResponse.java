package com.stayswap.domains.house.model.dto.response;

import com.stayswap.domains.house.model.entity.House;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class CreateHouseResponse {

    @Schema(description = "숙소(집) Id", example = "1")
    private Long houseId;

    public static CreateHouseResponse of(House house) {
        return new CreateHouseResponse(house.getId());
    }
}
