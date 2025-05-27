package com.stayswap.user.model.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateIntroductionRequest {

    @Size(max = 500, message = "소개는 최대 500자까지 입력 가능합니다.")
    private String introduction;
} 