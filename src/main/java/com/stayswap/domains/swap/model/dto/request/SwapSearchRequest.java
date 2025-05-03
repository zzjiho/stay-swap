package com.stayswap.domains.swap.model.dto.request;

import com.stayswap.domains.swap.constant.SwapStatus;
import com.stayswap.domains.swap.constant.SwapType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SwapSearchRequest {
    
    @NotNull(message = "사용자 ID는 필수입니다.")
    private Long userId;
    
    private String status;
    
    private String type;
    
    public SwapStatus getSwapStatus() {
        if (status == null || status.isEmpty()) {
            return null;
        }
        
        try {
            return SwapStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 상태값입니다: " + status);
        }
    }
    
    public SwapType getSwapType() {
        if (type == null || type.isEmpty()) {
            return null;
        }
        
        try {
            return SwapType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 타입입니다: " + type);
        }
    }
} 