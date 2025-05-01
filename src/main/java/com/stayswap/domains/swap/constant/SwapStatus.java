package com.stayswap.domains.swap.constant;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum SwapStatus {

    PENDING("대기"),
    ACCEPTED("확정"),
    REJECTED("거절"),
    CANCELED("취소"),
    COMPLETED("완료");

    private final String description;


}


