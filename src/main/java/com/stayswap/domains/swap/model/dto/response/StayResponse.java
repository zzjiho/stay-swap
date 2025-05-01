package com.stayswap.domains.swap.model.dto.response;

import com.stayswap.domains.swap.constant.SwapStatus;
import com.stayswap.domains.swap.constant.SwapType;
import com.stayswap.domains.swap.model.entity.Swap;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StayResponse {
    private Long swapId;
    private Long requesterId;
    private Long targetHouseId;
    private LocalDate startDate;
    private LocalDate endDate;
    private SwapType swapType;
    private SwapStatus swapStatus;
    private String message;
    
    public static StayResponse of(Swap swap) {
        return StayResponse.builder()
                .swapId(swap.getId())
                .requesterId(swap.getRequester().getId())
                .targetHouseId(swap.getHouse().getId())
                .startDate(swap.getStartDate())
                .endDate(swap.getEndDate())
                .swapType(swap.getSwapType())
                .swapStatus(swap.getSwapStatus())
                .message(swap.getMessage())
                .build();
    }
} 