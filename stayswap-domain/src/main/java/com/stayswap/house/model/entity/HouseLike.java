package com.stayswap.house.model.entity;

import com.stayswap.common.entity.BaseTimeEntity;
import com.stayswap.user.model.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Builder
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "house_id"})
})
public class HouseLike extends BaseTimeEntity {

    @Id
    @Column(name = "house_like_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "house_id", nullable = false)
    private House house;

    public static HouseLike of(User user, House house) {
        return HouseLike.builder()
                .user(user)
                .house(house)
                .build();
    }
} 