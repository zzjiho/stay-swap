package com.stayswap.notification.model.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "알림 읽은 시간 설정 응답")
public class SetLastReadAtResponse {
    
    @Schema(description = "마지막 읽은 시간")
    private Instant lastReadAt;
} 