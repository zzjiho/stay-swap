package com.stayswap.notification.constant;

public enum NotificationType {
    BOOKING_REQUEST("숙박 요청"),
    SWAP_REQUEST("교환 요청"),
    BOOKING_ACCEPTED("숙박 승인"),
    SWAP_ACCEPTED("교환 승인"),
    BOOKING_REJECTED("숙박 거절"),
    SWAP_REJECTED("교환 거절"),
    BOOKING_EXPIRED("숙박 만료"),
    SWAP_EXPIRED("교환 만료"),
    CHECK_IN("체크인 알림"),
    CHECK_OUT("체크아웃 알림"),
    LIKE_ADDED("좋아요 추가"),
    LIKE_REMOVED("좋아요 취소"),
    TEST_NOTIFICATION("테스트 알림"),
    TEST_FAIL("실패 테스트 알림");


    private final String description;

    NotificationType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
} 