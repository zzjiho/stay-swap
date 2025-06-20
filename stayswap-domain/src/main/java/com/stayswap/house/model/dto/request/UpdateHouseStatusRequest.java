package com.stayswap.house.model.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateHouseStatusRequest {
    
    @NotNull(message = "활성화 상태는 필수 값입니다.")
    private Boolean active;

}