package com.stayswap.notification.model.document;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.TypeAlias;

/**
 * 좋아요 관련 알림 (좋아요 추가, 좋아요 취소)
 */
@Getter
@SuperBuilder
@NoArgsConstructor
@TypeAlias("LikeNotification")
public class LikeNotification extends Notification {
    // 좋아요 알림에만 필요한 특수 필드
    private Long accommodationId;      // 좋아요 받은 숙소 ID
    private String accommodationName;  // 숙소 이름
}