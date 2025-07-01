package com.stayswap.house.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CountryResponse {
    private String countryKo;
    private String countryEn;

    public static CountryResponse of(String countryKo, String countryEn) {
        return new CountryResponse(countryKo, countryEn);
    }
} 