package com.stayswap.user.model.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Pattern;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UpdateNicknameRequest {

    @Pattern(regexp = "^[a-zA-Z가-힣0-9]{2,10}$", message = "닉네임은 2~10자의 한글, 영문, 숫자로 입력해 주세요")
    @Schema(description = "유저 닉네임", example = "까만까마귀")
    private String nickname;
}
