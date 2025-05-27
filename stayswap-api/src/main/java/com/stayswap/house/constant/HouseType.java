package com.stayswap.house.constant;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum HouseType {

    APT("아파트"),
    HOUSE("주택"),
    VILLA("빌라"),
    OP("오피스텔"),
    OTHER("기타");

    private final String description;


}


