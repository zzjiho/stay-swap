package com.stayswap.domains.user.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class UpdateIntroductionResponse {

    private String introduction;
    
    public static UpdateIntroductionResponse from(String introduction) {
        return UpdateIntroductionResponse.builder()
                .introduction(introduction)
                .build();
    }
} 