package com.stayswap.notification.model.document;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.TypeAlias;

/**
 * 테스트 알림 및 기타 알림
 */
@Getter
@SuperBuilder
@NoArgsConstructor
@TypeAlias("TestNotification")
public class TestNotification extends Notification {
    private String testField;
}