package com.stayswap.notification.document;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.TypeAlias;

/**
 * 교환 관련 알림 (교환 요청, 교환 승인, 교환 거절)
 */
@Getter
@SuperBuilder
@NoArgsConstructor
@TypeAlias("SwapNotification")
public class SwapNotification extends Notification {
    private Long myAccommodationId;        // 내 숙소 ID
    private Long theirAccommodationId;     // 상대방 숙소 ID
    private String myAccommodationName;    // 내 숙소 이름
    private String theirAccommodationName; // 상대방 숙소 이름
}