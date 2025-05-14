package com.stayswap.domains.notification.model.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class TestNotificationRequest {
    
    @Schema(description = "알림 제목", example = "테스트 알림입니다")
    private String title;
    
    @Schema(description = "알림 내용", example = "이것은 테스트 알림 내용입니다.")
    private String content;
} 