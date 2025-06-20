package com.stayswap.house.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class UpdateHouseStatusResponse {
    
    private Long houseId;
    private Boolean isActive;
    
    public static UpdateHouseStatusResponse of(Long houseId, Boolean isActive) {
        return UpdateHouseStatusResponse.builder()
                .houseId(houseId)
                .isActive(isActive)
                .build();
    }
} 