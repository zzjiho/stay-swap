package com.stayswap.domains.swap.model.dto.request;

import com.stayswap.domains.swap.constant.SwapStatus;
import com.stayswap.domains.swap.constant.SwapType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SwapSearchRequest {

    private SwapStatus swapStatus;
    private SwapType swapType;
}