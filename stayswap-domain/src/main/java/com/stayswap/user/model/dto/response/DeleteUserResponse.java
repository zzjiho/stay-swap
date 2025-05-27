package com.stayswap.user.model.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@Schema(description = "회원 탈퇴 Response DTO")
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class DeleteUserResponse {

    @Schema(description = "회원 Id", example = "1")
    private Long id;

    public static DeleteUserResponse of(Long userId) {
        return new DeleteUserResponse(userId);
    }
}