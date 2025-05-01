package com.stayswap.domains.swap.constant;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum SwapType {

    SWAP("교환"),
    STAY("숙박");

    private final String description;
}


