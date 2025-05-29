package com.stayswap.user.model.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class UpdateNicknameResponse {

    @Schema(description = "유저 닉네임", example = "까만까마귀")
    private String nickname;

    public static UpdateNicknameResponse of(String nickname) {
        return new UpdateNicknameResponse(nickname);
    }
}
