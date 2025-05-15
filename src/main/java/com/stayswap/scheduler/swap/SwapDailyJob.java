package com.stayswap.scheduler.swap;

import com.stayswap.domains.notification.service.NotificationService;
import com.stayswap.domains.swap.service.SwapServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SwapDailyJob {

    private final SwapServiceImpl swapServiceImpl;
    private final NotificationService notificationService;

    public void run() {
        log.info("체크인 당일 알림 발송 작업 시작");
        notificationService.createCheckinNotification();
        log.info("체크인 당일 알림 발송 작업 완료");
    }
}
