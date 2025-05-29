package com.stayswap.swap.model.dto.response;

import com.stayswap.house.constant.HouseType;
import com.stayswap.swap.constant.SwapStatus;
import com.stayswap.swap.constant.SwapType;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class SwapListResponse {
    // Swap 정보
    private Long swapId;
    private Long requesterId;
    private LocalDate startDate;
    private LocalDate endDate;
    private SwapType swapType;
    private SwapStatus swapStatus;
    private String message;
    private LocalDateTime responseAt;
    
    // House 정보
    private Long hostHouseId;         // 호스트(내) 집 ID
    private String houseTitle;        // 숙소 제목
    private Long requesterHouseId;    // 요청자 집 ID
    private HouseType houseType;      // 숙소 유형
    private String imageUrl;          // 대표 이미지 URL
} 