package com.stayswap.swap.model.entity;

import com.stayswap.common.entity.BaseTimeEntity;
import com.stayswap.house.model.entity.House;
import com.stayswap.swap.constant.SwapStatus;
import com.stayswap.swap.constant.SwapType;
import com.stayswap.user.model.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Swap extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "swap_id")
    private Long id;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    private SwapStatus swapStatus;

    @Enumerated(EnumType.STRING)
    private SwapType swapType;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "response_at")
    private LocalDateTime responseAt;

    private Integer guest;

    @ManyToOne
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @ManyToOne
    @JoinColumn(name = "requester_house_id")
    private House requesterHouseId;

    @ManyToOne
    @JoinColumn(name = "house_id", nullable = false)
    private House house;
    
    public void accept() {
        this.swapStatus = SwapStatus.ACCEPTED;
        this.responseAt = LocalDateTime.now();
    }
    
    public void reject() {
        this.swapStatus = SwapStatus.REJECTED;
        this.responseAt = LocalDateTime.now();
    }
    
    public void cancel() {
        this.swapStatus = SwapStatus.CANCELED;
        this.responseAt = LocalDateTime.now();
    }
    
    public void expire() {
        this.swapStatus = SwapStatus.EXPIRED;
        this.responseAt = LocalDateTime.now();
    }
}
