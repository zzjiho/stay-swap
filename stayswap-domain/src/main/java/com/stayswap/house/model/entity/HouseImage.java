package com.stayswap.house.model.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
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

    public static HouseImage newHouseImg(String url, String path, House house) {
        return HouseImage.builder()
                .imageUrl(url)
                .path(path)
                .house(house)
                .build();
    }

}
