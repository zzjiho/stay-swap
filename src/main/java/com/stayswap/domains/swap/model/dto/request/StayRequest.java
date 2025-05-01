package com.stayswap.domains.swap.model.dto.request;

import com.stayswap.domains.house.model.entity.House;
import com.stayswap.domains.swap.constant.SwapStatus;
import com.stayswap.domains.swap.constant.SwapType;
import com.stayswap.domains.swap.model.entity.Swap;
import com.stayswap.domains.user.model.entity.User;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class StayRequest {

    @NotNull(message = "대상 숙소 ID는 필수값입니다.")
    private Long targetHouseId;

    @NotNull(message = "체크인 날짜는 필수값입니다.")
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;

    @NotNull(message = "체크아웃 날짜는 필수값입니다.")
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;

    private String message;
    
    public Swap toEntity(User requester, House targetHouse) {
        return Swap.builder()
                .startDate(this.startDate)
                .endDate(this.endDate)
                .swapStatus(SwapStatus.PENDING)
                .swapType(SwapType.STAY)
                .message(this.message)
                .requester(requester)
                .house(targetHouse)
                .build();
    }
} 