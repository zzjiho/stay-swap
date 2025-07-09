package com.stayswap.scheduler.swap;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
//@Profile("batch")
@RequiredArgsConstructor
public class SwapBatchScheduler {

    private final SwapDailyJob swapDailyJob;
    private final SwapExpirationJob swapExpirationJob;

    /**
     * 체크인 당일 오전 9:00시에 푸시알림 발송하는 스케줄러
     */
    @Scheduled(cron = "0 0 9 * * ?")
//    @Scheduled(cron = "*/30 * * * * ?")
    public void sendCheckinNotification() {
        log.info("체크인 당일 알림 발송 스케줄러 실행");
        swapDailyJob.run();
    }

    /**
     * 30분마다 36시간 지난 PENDING 요청들을 만료 처리하는 스케줄러
     */
//    @Scheduled(cron = "0 */30 * * * ?")
    @Scheduled(cron = "*/30 * * * * ?")
    public void expirePendingSwaps() {
        log.info("교환/숙박 요청 만료 처리 스케줄러 실행");
        swapExpirationJob.run();
    }

}
