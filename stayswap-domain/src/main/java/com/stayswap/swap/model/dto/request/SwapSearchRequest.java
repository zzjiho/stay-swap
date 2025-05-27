package com.stayswap.swap.model.dto.request;

import com.stayswap.swap.constant.SwapStatus;
import com.stayswap.swap.constant.SwapType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SwapSearchRequest {

    private SwapStatus swapStatus;
    private SwapType swapType;
}