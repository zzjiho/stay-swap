package com.stayswap.domains.house.model.entity;

import jakarta.persistence.Entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class HouseImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "house_img_id")
    private Long id;

    private String imageUrl;

    private String path;

    @ManyToOne
    @JoinColumn(name = "house_id", nullable = false)
    private House house;
}
