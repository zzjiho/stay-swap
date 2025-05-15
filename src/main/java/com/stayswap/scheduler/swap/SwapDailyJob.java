package com.stayswap.scheduler.swap;

import com.stayswap.domains.notification.service.CheckInOutNotificationService;
import com.stayswap.domains.swap.service.SwapServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SwapDailyJob {

    private final SwapServiceImpl swapServiceImpl;
    private final CheckInOutNotificationService checkInOutNotificationService;

    public void run() {
        log.info("알림 발송 작업 시작");
        
        // 체크인 알림 발송
        checkInOutNotificationService.createCheckinNotification();
        
        // 체크아웃 알림 발송
        checkInOutNotificationService.createCheckoutNotification();
        
        log.info("알림 발송 작업 완료");
    }
}
