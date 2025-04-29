package com.stayswap.domains.swap.model.entity;

import com.stayswap.domains.common.entity.BaseEntity;
import com.stayswap.domains.house.model.entity.House;
import com.stayswap.domains.user.model.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Swap extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "swap_id")
    private Long id;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(nullable = false)
    private String status; // pending, accepted, rejected, canceled, completed

    @Column(nullable = false)
    private String swapType;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "response_at")
    private LocalDateTime responseAt;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User requester;

    @ManyToOne
    @JoinColumn(name = "requester_house_id")
    private House requesterHouseId;

    @ManyToOne
    @JoinColumn(name = "house_id", nullable = false)
    private House house;

}
