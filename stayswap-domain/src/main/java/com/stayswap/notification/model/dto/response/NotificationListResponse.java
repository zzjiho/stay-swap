package com.stayswap.notification.model.dto.response;

import com.stayswap.notification.model.document.Notification;
import com.stayswap.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "알림 목록 응답")
public class NotificationListResponse {
    
    @Schema(description = "알림 목록")
    private List<NotificationResponse> notifications;
    
    @Schema(description = "다음 페이지 존재 여부")
    private boolean hasNext;
    
    @Schema(description = "다음 페이지 요청 시 사용할 pivot 값")
    private Instant pivot;
} 