package com.stayswap.review.model.entity;

import com.stayswap.common.entity.BaseTimeEntity;
import com.stayswap.house.model.entity.House;
import com.stayswap.swap.model.entity.Swap;
import com.stayswap.user.model.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;


@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Review extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    private Long id;

    @Column(nullable = false)
    private Integer rating;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @ManyToOne
    @JoinColumn(name = "swap_id", nullable = false)
    private Swap swap;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne
    @JoinColumn(name = "target_house_id", nullable = false)
    private House targetHouse;
    
    @Builder
    public Review(Integer rating, String comment, Swap swap, User user, House targetHouse) {
        this.rating = rating;
        this.comment = comment;
        this.swap = swap;
        this.user = user;
        this.targetHouse = targetHouse;
    }
}