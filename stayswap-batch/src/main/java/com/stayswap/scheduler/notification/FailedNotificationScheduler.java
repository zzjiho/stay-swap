package com.stayswap.scheduler.notification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class FailedNotificationScheduler {

    private final FailedNotificationJob failedNotificationJob;

    /**
     * 실패한 알림 메시지 재처리 스케줄러 - 30분마다 실행
     */
//    @Scheduled(cron = "0 */30 * * * ?")
    @Scheduled(fixedDelay = 30000)
    public void retryFailedNotifications() {
        log.info("실패한 알림 메시지 재처리 스케줄러 실행");
        failedNotificationJob.run();
    }
} 