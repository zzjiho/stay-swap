package com.stayswap.user.model.dto.response;

import com.stayswap.user.model.entity.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class LogoutResponse {

    @Schema(description = "유저 ID", example = "1")
    private Long userId;

    public static LogoutResponse of(User user) {
        return new LogoutResponse(user.getId());
    }
}
