package com.stayswap.swap.constant;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum SwapStatus {

    PENDING("대기"),
    ACCEPTED("확정"),
    REJECTED("거절"),
    CANCELED("취소"),
    EXPIRED("만료"), // 36시간 내 응답 없음으로 자동 만료
    COMPLETED("완료"); // 숙소 숙박, 교환이 완전히 이루어지고 체크아웃 까지 완료 되었을 때

    private final String description;


}


