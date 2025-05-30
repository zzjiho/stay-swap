package com.stayswap.notification.model.document;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.TypeAlias;

import java.time.Instant;

/**
 * 예약 관련 알림 (예약 요청, 예약 승인, 예약 거절, 체크인, 체크아웃)
 */
@Getter
@SuperBuilder
@NoArgsConstructor
@TypeAlias("BookingNotification")
public class BookingNotification extends Notification {
    private Long accommodationId;      // 예약 관련 숙소 ID
    private String accommodationName;  // 숙소 이름
    private Instant checkInDate;       // 체크인 날짜
    private Instant checkOutDate;      // 체크아웃 날짜
}