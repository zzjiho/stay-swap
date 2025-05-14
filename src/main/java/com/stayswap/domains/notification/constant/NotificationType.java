package com.stayswap.domains.notification.constant;

public enum NotificationType {
    BOOKING_REQUEST("숙박 요청"),
    SWAP_REQUEST("교환 요청"),
    BOOKING_ACCEPTED("숙박 승인"),
    SWAP_ACCEPTED("교환 승인"),
    BOOKING_REJECTED("숙박 거절"),
    SWAP_REJECTED("교환 거절"),
    TEST_NOTIFICATION("테스트 알림");

    private final String description;

    NotificationType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
} 