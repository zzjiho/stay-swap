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
public class SwapResponse {
    private Long swapId;
    private Long requesterId;
    private Long requesterHouseId;
    private Long targetHouseId;
    private LocalDate startDate;
    private LocalDate endDate;
    private SwapType swapType;
    private SwapStatus swapStatus;
    private String message;
    
    public static SwapResponse of(Swap swap) {
        return SwapResponse.builder()
                .swapId(swap.getId())
                .requesterId(swap.getRequester().getId())
                .requesterHouseId(swap.getRequesterHouseId() != null ? swap.getRequesterHouseId().getId() : null)
                .targetHouseId(swap.getHouse().getId())
                .startDate(swap.getStartDate())
                .endDate(swap.getEndDate())
                .swapType(swap.getSwapType())
                .swapStatus(swap.getSwapStatus())
                .message(swap.getMessage())
                .build();
    }
} 