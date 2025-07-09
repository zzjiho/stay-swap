package com.stayswap.scheduler.swap;

import com.stayswap.swap.service.SwapService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SwapExpirationJob {

    private final SwapService swapService;

    public void run() {
        log.info("교환/숙박 요청 만료 처리 작업 시작");
        
        try {
            swapService.expirePendingSwaps();
            log.info("교환/숙박 요청 만료 처리 작업 완료");
        } catch (Exception e) {
            log.error("교환/숙박 요청 만료 처리 작업 중 오류 발생", e);
        }
    }
} 