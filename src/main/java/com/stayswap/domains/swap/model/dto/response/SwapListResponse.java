package com.stayswap.domains.swap.model.dto.response;

import com.stayswap.domains.swap.constant.SwapStatus;
import com.stayswap.domains.swap.constant.SwapType;
import com.stayswap.domains.swap.model.entity.Swap;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SwapListResponse {
    private Long swapId;
    private Long requesterId;
    private Long requesterHouseId;
    private Long targetHouseId;
    private LocalDate startDate;
    private LocalDate endDate;
    private SwapType swapType;
    private SwapStatus swapStatus;
    private String message;
    private LocalDateTime responseAt;

    public static SwapListResponse of(Swap swap) {
        return SwapListResponse.builder()
                .swapId(swap.getId())
                .requesterId(swap.getRequester().getId())
                .requesterHouseId(swap.getRequesterHouseId() != null ? swap.getRequesterHouseId().getId() : null)
                .targetHouseId(swap.getHouse().getId())
                .startDate(swap.getStartDate())
                .endDate(swap.getEndDate())
                .swapType(swap.getSwapType())
                .swapStatus(swap.getSwapStatus())
                .message(swap.getMessage())
                .responseAt(swap.getResponseAt())
                .build();
    }
} 