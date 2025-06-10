package com.stayswap.notification.document;

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
    private Long accommodationId;      // 좋아요 받은 숙소 ID
    private String accommodationName;  // 숙소 이름

}